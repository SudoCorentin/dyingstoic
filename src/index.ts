import pg from 'pg'
import axios from 'axios'
import { TweetV2PostTweetResult, TwitterApi } from 'twitter-api-v2'
import dotenv from 'dotenv'
import { scraper } from './scraper'

dotenv.config({ path: '.env' })

const getEnvOrCrash = (envVarName: string): string => {
    const val = process.env[envVarName]
    if (typeof val === 'string') return val
    throw new Error('MISSING ENV VAR: ' + envVarName)
}

const post_on_twitter = async () => {
    const twitterApiForDyingStoic = new TwitterApi({
        appKey: getEnvOrCrash('TWITTER_APP_KEY'),
        appSecret: getEnvOrCrash('TWITTER_APP_SECRET'),
        accessToken: getEnvOrCrash('TWITTER_ACCESS_TOKEN'),
        accessSecret: getEnvOrCrash('TWITTER_ACCESS_SECRET'),
    })

    // -----------DB Fetching-----------
    // for tweet = false, we fetch the obituaries that have not been tweeted yet

    const connectionString = getEnvOrCrash('DB_KEY')

    // avoid ssl requirements
    const db_client = new pg.Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false,
        },
    })

    await db_client.connect()

    const db_obituary_response = await db_client.query(
        'SELECT * from obituaries WHERE is_twitted is FALSE ORDER BY id DESC LIMIT 1',
    )
    const db_tweet_response = await db_client.query('SELECT * from tweets ORDER BY tweet_time DESC LIMIT 1')

    // -----------Casting and filtering-----------

    // Don't post if last tweet was within 24h
    if (db_tweet_response.rows.length > 0) {
        const last_tweet_time = db_tweet_response.rows[0].tweet_time
        const now = new Date()
        const diff_ms = now.getTime() - last_tweet_time.getTime()
        const diff_hours = Math.floor(diff_ms / 3600000)

        if (diff_hours < 24) {
            console.log('Last tweet was within 24h, not posting again')
            return
        }
        console.log(last_tweet_time)
        console.log(now)
        console.log(diff_ms)
        console.log('diff in hours ', diff_hours)
    }

    if (db_obituary_response.rows.length === 0) {
        console.log('No obituary to post')
        return
    }

    const obituary_to_tweet = db_obituary_response.rows[0]
    const tweet_pic = obituary_to_tweet.picture_url

    // share only name's first word to increase privacy
    const first_name = obituary_to_tweet.name.replace(/ .*/, '')
    const standard_message = ' left us. \r\n\r\nRemember you will die too.'
    const tweet_text = first_name.concat(standard_message)

    console.log('first name  ', first_name)
    console.log('twitter text  ', tweet_text)

    // -----------Upload pic to Twitter-----------

    // Download pic
    const axios_response = await axios.get(tweet_pic, {
        responseType: 'arraybuffer',
    })
    const pic_upload_stream = axios_response.data
    const pic_type = axios_response.headers['content-type']

    console.log('got back image from picture_url', pic_type, pic_upload_stream.length)
    const photoID = await twitterApiForDyingStoic.v1.uploadMedia(pic_upload_stream, {
        mimeType: pic_type,
    })
    console.log('uploaded image to twitter', photoID)

    // -----------Post on Twitter-----------

    const uploadedTweet = await twitterApiForDyingStoic.v2.tweet(tweet_text, { media: { media_ids: [photoID] } })
    console.log('uploaded tweet successfuly', uploadedTweet.data, uploadedTweet.errors)

    // -----------Add to DB from Twitter-----------

    // Get data from Twitter API
    const tweet_url = uploadedTweet.data.text
    // replace by actual API result
    const tweet_time = new Date().toISOString()

    // Mark row as processed/twitted
    await db_client.query(`UPDATE obituaries SET is_twitted = TRUE WHERE id = ${obituary_to_tweet.id}`)

    // Log tweet in db
    // TODO escape if Twitter API shows tweet not successfully posted
    const insert_query = `INSERT INTO tweets(tweet_text, tweet_time, tweet_url) VALUES ('${tweet_text}','${tweet_time}','${tweet_url}');`
    console.log(insert_query)
    await db_client.query(insert_query)
    await db_client.end()
}

async function main() {
    const scraped_results = scraper()
    const posted_results = post_on_twitter()
    await Promise.all([scraped_results, posted_results])
}

console.log('running DyingStoic')

main()
    .then(() => {
        console.log('DyingStoic successfully ran')
        process.exit(0)
    })

    .catch((error) => {
        console.error('DyingStoic failed', error)
        process.exit(1)
    })
