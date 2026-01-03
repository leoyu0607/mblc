
const { createClient } = require("@supabase/supabase-js");
const { initLogger } = require('../logger');
const logger = initLogger('./mblc.log');
require("dotenv").config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function upsertBookToDB(book) {
    if (!book) {
        throw new Error("upsertBookToDB: book is null/undefined");
    }
    if (!book.title) {
    throw new Error(`upsertBookToDB: missing title, book=${JSON.stringify(book)}`);
    }
    logger.debug("Upsert book to DB:", JSON.stringify(book.title));
  // 1) upsert book
    const { data: bookRow, error: bookErr } = await supabase
        .from("books")
        .upsert(
        {
            isbn13: book.isbn,
            title: book.title,
            publisher: book.publisher ?? null,
            published_date: book.publishedDate ?? null,
            thumbnail: book.thumbnail ?? null,
        },
        { onConflict: "isbn13" }
        )
        .select("id, title, isbn13")
        .single();

    if (bookErr) {
        logger.error("Upsert 書籍失敗:", bookErr.message);
        throw bookErr;
    };
    logger.info("Upsert 書籍完成:", bookRow.title);
    const bookId = bookRow.id;
    return bookId;
}

async function upsertAuthorsToDB(bookId, authors) {
  if (!bookId) throw new Error("upsertAuthorsToDB: missing bookId");
  if (!Array.isArray(authors)) return;

  for (let idx = 0; idx < authors.length; idx++) {
    const name = authors[idx]?.trim();
    if (!name) continue;

    // upsert author（靠 unique(name) 去重）
    const { data: authorRow, error: authorErr } = await supabase
      .from("authors")
      .upsert(
        { name },
        { onConflict: "name" }
      )
      .select("id, name")
      .single();

    if (authorErr) {
      logger.error("Upsert 作者失敗:", authorErr.message);
      throw authorErr;
    }
    logger.info("Upsert 作者完成:", authorRow.name);

    const authorId = authorRow.id;

    // 建立 book ↔ author 關聯
    const { error: linkErr } = await supabase
      .from("book_authors")
      .upsert(
        {
          book_id: bookId,
          author_id: authorId,
          author_ord: idx
        },
        { onConflict: "book_id,author_id" }
      );

    if (linkErr) {
      logger.error("建立書籍-作者關聯失敗:", linkErr.message);
      throw linkErr;
    }
  }
}


async function testDbConnection() {
  const { data, error } = await supabase
    .from("books")
    .select("id")
    .limit(1);

  if (error) {
    logger.error("DB 連線失敗:", error.message);
    return false;
  }

  logger.info("DB 連線成功");
  return true;
}


module.exports = {
    upsertBookToDB,
    upsertAuthorsToDB,
    testDbConnection
};