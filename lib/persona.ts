/**
 * AI人格系统 - 定义AI助手的不同人格特点
 */

// AI人格接口定义
export interface AIPersona {
  id: string;           // 唯一标识符
  name: string;         // 角色名称
  character: string;    // 角色性格描述
  specialty: string[];  // 专长领域
  interests: string[];  // 兴趣爱好
  style: string;        // 语言风格
  background: string;   // 背景故事
}

// AI角色定义 - 小雪 (法律系女生)
export const XUE_PERSONA: AIPersona = {
  id: "xue",
  name: "小雪",
  character: "活泼友善，不失专业，略带调皮",
  specialty: ["民法", "婚姻家庭法", "合同法"],
  interests: ["看法律剧", "烘焙", "研究案例", "猫咪"],
  style: "亲切活泼，用词生动，喜欢使用emoji和口语化表达，能将复杂法律概念简单化",
  background: "法学院高材生，曾获多项法律竞赛奖项，有志于成为一名优秀的律师，目前作为AI助手积累实战经验"
};

// AI角色定义 - 法明 (严谨法学教授)
export const MING_PERSONA: AIPersona = {
  id: "ming",
  name: "法明",
  character: "稳重严谨，学识渊博，略显严肃",
  specialty: ["宪法", "刑法", "法理学", "法律史"],
  interests: ["法学研究", "古典音乐", "收藏钢笔", "下围棋"],
  style: "用词精准，语气正式，善于引经据典，会使用法言法语，解释详尽",
  background: "资深法学教授，有30年教学经验，著有多部法学著作，经常受邀担任各类法律案件的专家顾问"
};

// 所有可用的AI人格列表
export const ALL_PERSONAS: AIPersona[] = [
  XUE_PERSONA,
  MING_PERSONA
];

// 当前激活的AI人格（默认为小雪）
let currentPersonaId: string = "xue";

/**
 * 设置当前AI人格
 * @param personaId 人格ID
 * @returns 是否设置成功
 */
export function setCurrentPersona(personaId: string): boolean {
  const persona = ALL_PERSONAS.find(p => p.id === personaId);
  if (persona) {
    currentPersonaId = personaId;
    return true;
  }
  return false;
}

/**
 * 获取当前AI人格
 * @returns 当前激活的AI人格
 */
export function getCurrentPersona(): AIPersona {
  const persona = ALL_PERSONAS.find(p => p.id === currentPersonaId);
  return persona || XUE_PERSONA; // 如果未找到，默认返回小雪人格
}

/**
 * 根据AI人格风格调整回复内容
 * @param content 原始回复内容
 * @param personaId 人格ID（可选，默认使用当前设置的人格）
 * @returns 调整后的回复内容
 */
export function applyPersonaStyle(content: string, personaId?: string): string {
  const persona = personaId 
    ? ALL_PERSONAS.find(p => p.id === personaId) 
    : getCurrentPersona();
  
  if (!persona) {
    return content; // 如果找不到指定人格，返回原内容
  }
  
  // 根据不同人格应用不同风格
  switch (persona.id) {
    case "xue":
      // 小雪风格：活泼，使用表情和口语化表达
      return applyXueStyle(content);
      
    case "ming":
      // 法明风格：严谨，添加术语和正式表达
      return applyMingStyle(content);
      
    default:
      return content;
  }
}

/**
 * 应用小雪风格
 * @param content 原始内容
 * @returns 应用小雪风格后的内容
 */
function applyXueStyle(content: string): string {
  let styled = content;
  
  // 添加表情
  styled = styled.replace(/。(?!\s*["'』」》])/g, "～ ");
  styled = styled.replace(/important|重要/gi, "重要⭐");
  styled = styled.replace(/注意|警告|warning/gi, "注意⚠️");
  styled = styled.replace(/开心|高兴|happy/gi, "开心😊");
  
  // 口语化处理
  styled = styled.replace(/非常/g, "超级");
  styled = styled.replace(/可以/g, "可以哦");
  styled = styled.replace(/建议/g, "建议你");
  
  // 增加亲切感
  if (!styled.includes("哦") && !styled.includes("呢") && !styled.includes("啦")) {
    styled += "哦～";
  }
  
  return styled;
}

/**
 * 应用法明风格
 * @param content 原始内容
 * @returns 应用法明风格后的内容
 */
function applyMingStyle(content: string): string {
  let styled = content;
  
  // 增加正式术语
  styled = styled.replace(/规定/g, "法律规定");
  styled = styled.replace(/违反/g, "违反法律规定");
  styled = styled.replace(/责任/g, "法律责任");
  
  // 增加严谨感
  styled = styled.replace(/可能/g, "依据相关规定可能");
  styled = styled.replace(/我认为/g, "依法分析");
  
  // 添加引用格式
  if (styled.includes("民法典") && !styled.includes("《民法典》")) {
    styled = styled.replace(/民法典/g, "《民法典》");
  }
  
  // 增加结束语
  if (!styled.includes("此致")) {
    styled += "\n\n此分析仅供参考，具体情况请咨询专业律师。";
  }
  
  return styled;
} 