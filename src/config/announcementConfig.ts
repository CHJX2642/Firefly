import type { AnnouncementConfig } from "../types/announcementConfig";

export const announcementConfig: AnnouncementConfig = {
	// 公告标题
	title: "欢迎来到千羽",

	// 公告内容
	content: "这里是一个专注于 AI 人工智能、电气工程与电子技术分享的技术博客。感谢你的访问，希望这里的内容对你有所帮助！",

	// 是否允许用户关闭公告
	closable: true,

	link: {
		// 启用链接
		enable: true,
		// 链接文本
		text: "了解更多",
		// 链接 URL
		url: "/about/",
		// 内部链接
		external: false,
	},
};
