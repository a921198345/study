-- 创建思维导图表
CREATE TABLE IF NOT EXISTS mindmaps (
  id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL,
  opml_content TEXT,
  json_content JSONB,
  nodes_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建更新时间戳触发器
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mindmaps_timestamp
BEFORE UPDATE ON mindmaps
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS mindmaps_is_active_idx ON mindmaps(is_active);
CREATE INDEX IF NOT EXISTS mindmaps_file_name_idx ON mindmaps(file_name);

-- 添加示例数据（可选）
INSERT INTO mindmaps (id, file_name, json_content, nodes_count, is_active)
VALUES (
  'sample-mindmap',
  '示例思维导图.opml',
  '{"nodeData":{"id":"root","topic":"示例思维导图","expanded":true,"children":[{"id":"1","topic":"示例节点1","expanded":true},{"id":"2","topic":"示例节点2","expanded":true}]}}',
  3,
  TRUE
)
ON CONFLICT (id) DO UPDATE
SET is_active = TRUE;

-- 说明：
-- 1. 此脚本创建mindmaps表用于存储思维导图数据
-- 2. 数据结构支持同时存储原始OPML和处理后的JSON格式
-- 3. is_active字段用于标记当前活跃的思维导图
-- 4. 时间戳自动更新机制确保记录修改时间
-- 5. 添加了示例数据，便于系统初始化后立即有可用数据 