-- 创建思维导图存储表
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

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_mindmaps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 挂载更新时间触发器
DROP TRIGGER IF EXISTS trigger_mindmaps_updated_at ON mindmaps;
CREATE TRIGGER trigger_mindmaps_updated_at
BEFORE UPDATE ON mindmaps
FOR EACH ROW
EXECUTE PROCEDURE update_mindmaps_updated_at();

-- 创建文件名索引用于搜索
CREATE INDEX IF NOT EXISTS idx_mindmaps_file_name
ON mindmaps (file_name);

-- 创建活跃文件索引
CREATE INDEX IF NOT EXISTS idx_mindmaps_is_active
ON mindmaps (is_active)
WHERE is_active = TRUE;

-- 创建一条测试数据
INSERT INTO mindmaps (
  id, 
  file_name, 
  json_content, 
  nodes_count,
  is_active
) VALUES (
  'simple-mindmap.json',
  '思维导图示例',
  '{
    "nodeData": {
      "id": "root",
      "topic": "思维导图示例",
      "expanded": true,
      "children": [
        {
          "id": "example-1",
          "topic": "这是示例节点",
          "expanded": true,
          "children": [
            {
              "id": "example-1-1",
              "topic": "子节点1",
              "expanded": true
            },
            {
              "id": "example-1-2",
              "topic": "子节点2",
              "expanded": true
            }
          ]
        },
        {
          "id": "example-2",
          "topic": "上传思维导图文件",
          "expanded": true
        }
      ]
    }
  }',
  3,
  TRUE
) ON CONFLICT (id) DO NOTHING; 