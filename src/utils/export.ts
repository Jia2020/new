import { TranscriptionRecord, ExportFormat } from '../types';

export function exportTranscription(record: TranscriptionRecord, format: ExportFormat) {
  let content = '';
  let mimeType = 'text/plain';
  let extension = 'txt';

  const titleClean = record.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_');

  if (format === 'txt') {
    content = `【语音转写文件】${record.title}\n`;
    content += `创建时间: ${new Date(record.createdAt).toLocaleString()}\n`;
    content += `语言类型: ${record.language}\n`;
    content += `----------------------------------------\n\n`;
    content += record.text;
    mimeType = 'text/plain;charset=utf-8';
    extension = 'txt';
  } else if (format === 'md') {
    content = `# ${record.title}\n\n`;
    content += `- **创建时间**: ${new Date(record.createdAt).toLocaleString()}\n`;
    content += `- **语言**: ${record.language}\n`;
    content += `- **模式**: ${record.mode === 'mic' ? '实时麦克风' : '文件导入'}\n\n`;
    content += `---\n\n`;
    content += `${record.text}\n`;
    mimeType = 'text/markdown;charset=utf-8';
    extension = 'md';
  } else if (format === 'json') {
    content = JSON.stringify(
      {
        id: record.id,
        title: record.title,
        text: record.text,
        language: record.language,
        mode: record.mode,
        createdAt: record.createdAt,
        createdAtFormatted: new Date(record.createdAt).toISOString(),
        durationSeconds: record.duration,
      },
      null,
      2
    );
    mimeType = 'application/json;charset=utf-8';
    extension = 'json';
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${titleClean}_${Date.now()}.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
