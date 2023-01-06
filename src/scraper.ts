import pg from 'pg'
import axios from 'axios'
import { load } from 'cheerio'

/*
Scrap website
Add to DB
Make it once a day (same cron job as index.ts, behind 24h behind is fine)
*/

export async function scraper() {
    // -----------Fetch latest obituaries-----------
    const connectionString =
        'postgres://mementomori_user:FWPBp6YBAUE1kZ6AyxRwXmScLcHlwH8k@dpg-cbj5hus41ls599pueh4g-a.ohio-postgres.render.com/mementomori'

    // avoid ssl requirements
    const db_client = new pg.Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false,
        },
    })

    await db_client.connect()

    const obituaries_already_in_db = await db_client.query('SELECT * from obituaries ORDER BY id DESC LIMIT 10')

    // -----------Scrap-----------

    const baseURL = 'https://www.forevermissed.com'
    const url = `${baseURL}/findmemorial/`
    const data = await axios.get(url, {
        responseType: 'text',
    })

    const html = data.data

    // Extract data
    const $ = load(html)
    let deads: { name: string; picture_url: string; date_birth: number; date_death: number }[] = []
    for (const i of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
        const $container = `#gallery-search > div.content.search-results > ul > li:nth-child(${i}) `
        const $img = $(`${$container} > a > img`)
        const $name = $(`${$container} > div > div.memorial-title > a > span:nth-child(1)`) // first span
        const $years = $(`${$container} > div > div.memorial-title > a > span:nth-child(2)`) // second span
        const picture_url_lowres = $img.first().attr('src')!

        // Reverse engineer HD pictures' URL format
        const picture_url = picture_url_lowres.replace(/_.+/g, '_1920x1080_f985cc.jpg')
        const years = $years.contents().text()
        const date_birth = +years.split('-')[0]?.replace('(', '').replace(' ', '')
        const date_death = +years.split('-')[1]?.replace(')', '').replace(' ', '')
        const name = $name.contents().text()
        deads.push({ name, picture_url, date_birth, date_death })
    }

    // remove entries without date_birth and date_death
    deads = deads.filter((d) => d.date_birth && d.date_death)

    // Add to DB only if not already in DB
    for (const dead of deads) {
        if (obituaries_already_in_db.rows.find((o) => o.name === dead.name)) {
            continue
        } else {
            const insert_query = `INSERT INTO obituaries(name, picture_url, date_birth, date_death) VALUES ('${dead.name}','${dead.picture_url}','${dead.date_birth}','${dead.date_death}');`
            console.log(insert_query)
            await db_client.query(insert_query)
        }
    }
    await db_client.end()
}
