-- 科目分类表
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 章节表
CREATE TABLE IF NOT EXISTS chapters (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 知识点表
CREATE TABLE IF NOT EXISTS knowledge_entries (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 添加全文搜索索引
ALTER TABLE knowledge_entries ADD COLUMN IF NOT EXISTS search_text TSVECTOR
  GENERATED ALWAYS AS (to_tsvector('chinese', title || ' ' || content)) STORED;

CREATE INDEX IF NOT EXISTS knowledge_search_idx ON knowledge_entries USING GIN (search_text);

-- 启用向量扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 为知识点表添加向量列
ALTER TABLE knowledge_entries ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 创建向量索引
CREATE INDEX IF NOT EXISTS knowledge_embedding_idx ON knowledge_entries USING ivfflat (embedding vector_l2_ops);

-- 创建向量搜索函数
CREATE OR REPLACE FUNCTION match_knowledge_entries (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id bigint,
  title text,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    knowledge_entries.id,
    knowledge_entries.title,
    knowledge_entries.content,
    1 - (knowledge_entries.embedding <=> query_embedding) as similarity
  FROM knowledge_entries
  WHERE 1 - (knowledge_entries.embedding <=> query_embedding) > match_threshold
  ORDER BY knowledge_entries.embedding <=> query_embedding
  LIMIT match_count;
END;
$$; 