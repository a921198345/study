import OpmlUploader from '../../../components/OpmlUploader';

export const metadata = {
  title: 'OPML思维导图上传 - AI考试伴侣',
  description: '上传OPML思维导图，构建知识树'
};

export default function OpmlUploadPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">OPML思维导图上传</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">什么是OPML?</h2>
        <p className="mb-4">
          OPML(Outline Processor Markup Language)是一种用于存储大纲信息的XML格式，
          广泛应用于思维导图、RSS阅读器和知识管理工具中。通过上传OPML文件，
          系统可以自动解析其结构并转换为知识树。
        </p>
        
        <h3 className="text-lg font-medium mt-6 mb-2">支持的工具:</h3>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>XMind</li>
          <li>MindNode</li>
          <li>iThoughts</li>
          <li>其他支持OPML导出的思维导图工具</li>
        </ul>
        
        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-md">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <span className="font-bold">提示:</span> 如果您的思维导图软件不直接支持OPML导出，
            请尝试先导出为Markdown或其他文本格式，然后使用在线工具转换为OPML格式。
          </p>
        </div>
      </div>
      
      <OpmlUploader />
      
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">使用说明</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>准备好您的OPML文件(通常从思维导图软件导出)</li>
          <li>点击"选择OPML文件"按钮，选择您的文件</li>
          <li>点击"上传并处理"按钮开始处理</li>
          <li>等待系统解析和处理，这可能需要几秒钟时间</li>
          <li>处理完成后，您将看到知识树结构的预览</li>
        </ol>
        
        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900 p-4 rounded-md">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <span className="font-bold">注意:</span> 对于非常大的思维导图(超过500个节点)，
            处理可能需要更长时间。请耐心等待处理完成。
          </p>
        </div>
      </div>
    </div>
  );
} 