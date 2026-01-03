const { initLogger } = require('../logger');
const { upsertBookToDB,upsertAuthorsToDB } = require('./upsertdb');
const logger = initLogger('./mblc.log');
//google books api
const api_base = 'https://www.googleapis.com/books/v1/volumes?'
const qt = 'lang_switch'
const lang = 'zh-tw'

async function handleEvent(e) {
    if (e?.type !== 'message' || e.message.type !== 'text') return;

    const userId = e.source.userId;
    const text = e.message.text;
    const timestamp = e.timestamp;
    const replyToken = e.replyToken;

    logger.info("[message/text]",{userId,text,timestamp})
    //組api
    const q = `isbn:${text}`;
    const u = new URL(api_base);
    u.searchParams.set("q",q);
    u.searchParams.set("qt",qt);
    u.searchParams.set("lang",lang);
    const url = u.toString();
    logger.info("URL=",url)
    let result = null;
    try {
        result = await callApi(url);
        logger.info("API call success!");
        logger.debug("API return:", JSON.stringify(result));
        if (!result.totalItems || !Array.isArray(result.items)) {
        logger.info("查無書籍");
        return;
        }
    }catch (err) {
        logger.error("API call failed:", err);
        return;
    }
    const book = parseGoogleBook(result);
    logger.info("書籍資訊：", JSON.stringify(book));
    const bookId = await upsertBookToDB(book);
    await upsertAuthorsToDB(bookId, book.authors);

}

async function callApi(url) {
    const res = await fetch(url);

    if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
    }

    const data = await res.json();
    return data;
}

function parseGoogleBook(data) {
    if (!data?.items?.length) return null;

    const info = data.items[0].volumeInfo;

    return {
        title: info.title ?? "",
        authors: info.authors ?? [],
        publisher: info.publisher ?? "",
        publishedDate: info.publishedDate ?? "",
        isbn: info.industryIdentifiers?.find(i => i.type === "ISBN_13")?.identifier,
        thumbnail: info.imageLinks?.thumbnail ?? "", //縮圖
    };
}

module.exports = { handleEvent };