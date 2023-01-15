import { TweetV2PostTweetResult, TwitterApi } from 'twitter-api-v2'
import { load } from 'cheerio'
import { execSync } from 'child_process'
import { existsSync, mkdirSync, readFileSync } from 'fs'
import dotenv from 'dotenv'

const DO_IT_FOR_REAL = false // ❌
const WITH_PHOTO = false // ❌

dotenv.config({ path: '.env' })

export class MementoMoriBot {
    constructor() {
        // every 3 hours: run
    }

    start = () => {
        setInterval(() => this.run(), 3 * 3_600 * 1000)
    }

    run = async () => {
        // if (this.hasAlreadyRunToday()) return console.log('already run today')
        const obituaries = this.getRecentObituaries()
        for (const obituary of obituaries) {
            await this.obituaryPerson(obituary.name, obituary.imgPath)
        }
    }

    hasAlreadyRunToday = () => existsSync(this.XXXX)

    obituaryPerson = async (name: string, imagePath: string) => {
        console.log(`tweeting about ${name}...`)
        if (!DO_IT_FOR_REAL) return
        let tweet: TweetV2PostTweetResult
        if (WITH_PHOTO) {
            const photoID = await this.twitter.v1.uploadMedia(imagePath)
            tweet = await this.twitter.v2.tweet(`MementoMori ${name}`, { media: { media_ids: [photoID] } })
        } else {
            tweet = await this.twitter.v2.tweet(`MementoMori ${name}`)
        }
        console.log('tweet id:', tweet.data.id)
    }

    scrappingFolder = './data'
    get today():string{ return new Date().toISOString().split('T')[0] } // prettier-ignore
    get XXXX(){ return `${this.scrappingFolder}/forevermissed-${this.today}.html` } // prettier-ignore

    /** scrap ... */
    getRecentObituaries = (): { name: string; imgPath: string }[] => {
        const baseURL = 'https://www.forevermissed.com'
        const url = `${baseURL}/findmemorial/`
        mkdirSync(this.scrappingFolder, { recursive: true })
        const target = `${this.scrappingFolder}/forevermissed-${this.today}.html`
        if (!existsSync(target)) execSync(`wget ${url} -O ${target}`, { stdio: 'inherit' })

        // DATA EXTRACTION
        const content = readFileSync(target, 'utf-8')
        const $ = load(content)
        let output: any[] = []
        for (const i of [1, 2, 3, 4]) {
            const $container = `#gallery-search > div.content.search-results > ul > li:nth-child(${i}) `
            const $img = $(`${$container} > a > img`)
            const $name = $(`${$container} > div > div.memorial-title > a > span`)
            const imgRelativeURL = $img.first().attr('src')!
            const imgURL = `${baseURL}${imgRelativeURL}`
            const imgName = imgRelativeURL.split('/').pop()
            const name = $name.contents().text()
            const imgPath = `${this.scrappingFolder}/${imgName}`
            if (!existsSync(imgPath)) execSync(`wget ${imgURL} -O ${imgPath}`, { stdio: 'inherit' })
            output.push({ name, imgPath })
        }
        return output
    }

    getEnvOrCrash = (envVarName: string): string => {
        const val = process.env[envVarName]
        if (typeof val === 'string') return val
        throw new Error('MISSING ENV VAR: ' + envVarName)
    }

    private twitter = new TwitterApi({
        appKey: this.getEnvOrCrash('TWITTER_APP_KEY'),
        appSecret: this.getEnvOrCrash('TWITTER_APP_SECRET'),
        accessToken: this.getEnvOrCrash('TWITTER_ACCESS_TOKEN'),
        accessSecret: this.getEnvOrCrash('TWITTER_ACCESS_SECRET'),
    })
}
