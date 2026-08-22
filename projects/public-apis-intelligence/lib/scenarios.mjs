import { enrichScenarioDefinition, buildDataCatalog } from "./data-profiles.mjs";

const CATEGORY_LABELS = {
  "Animals": "动物与宠物", "Anime": "动漫", "Anti-Malware": "恶意软件防护", "Art & Design": "艺术与设计",
  "Authentication & Authorization": "认证与授权", "Blockchain": "区块链", "Books": "图书与阅读", "Business": "商业服务",
  "Calendar": "日历", "Cloud Storage & File Sharing": "云存储与文件共享", "Continuous Integration": "持续集成",
  "Cryptocurrency": "加密货币", "Currency Exchange": "汇率", "Data Validation": "数据校验", "Development": "开发工具",
  "Dictionaries": "词典与语言", "Documents & Productivity": "文档与生产力", "Email": "电子邮件", "Entertainment": "娱乐",
  "Environment": "环境", "Events": "活动", "Finance": "金融", "Food & Drink": "餐饮与营养", "Games & Comics": "游戏与漫画",
  "Geocoding": "地理位置", "Government": "政府与公共事务", "Health": "健康医疗", "Jobs": "招聘求职",
  "Machine Learning": "机器学习与 AI", "Music": "音乐", "News": "新闻", "Open Data": "开放数据",
  "Open Source Projects": "开源项目", "Patent": "专利", "Personality": "个性化内容", "Phone": "电话",
  "Photography": "图像与摄影", "Programming": "编程", "Science & Math": "科学与数学", "Security": "网络安全",
  "Shopping": "购物电商", "Social": "社交", "Sports & Fitness": "体育健身", "Test Data": "测试数据",
  "Text Analysis": "文本分析", "Tracking": "追踪", "Transportation": "交通出行", "URL Shorteners": "短链接",
  "Vehicle": "车辆", "Video": "视频影视", "Agriculture": "农业", "Weather": "天气"
};

// 每行依次为：slug、场景名、解决的问题、匹配表达式、典型产品、选型重点。
const RAW = {
  "Animals": [
    ["pet-adoption", "宠物领养与救助", "查询待领养宠物、救助组织和领养条件", "adopt|adoption|petfinder|rescue", "宠物领养平台、救助站检索", "关注地域覆盖、记录更新频率和图片授权"],
    ["animal-media", "动物图片与趣味内容", "获取猫狗、鸟类或野生动物图片、动图和趣味事实", "picture|image|gif|photo|facts?|cat|dog|duck|fox|bear|shibe", "随机图片组件、儿童内容、占位素材", "确认图片版权、内容审核和缓存策略"],
    ["biodiversity", "物种与生物多样性", "查询物种分类、濒危状态、分布和保护信息", "species|biodiversity|iucn|red list|taxonomy|fishwatch", "自然教育、物种百科、保护研究", "关注科学名称、版本和数据来源"],
    ["wildlife-observation", "野生动物观测与迁徙", "读取鸟类观测、声音、迁徙和动物移动记录", "ebird|observation|migration|movement|recordings?|xeno", "观鸟地图、迁徙研究、声音识别", "关注坐标精度、时间范围和敏感物种保护"],
    ["pet-care", "宠物信息与照护", "获取宠物品种、特征、健康和饲养资料", "breed|pet|dogs|cats", "宠物百科、品种识别、养宠助手", "不要把通用资料替代兽医建议"]
  ],
  "Anime": [
    ["anime-catalog", "动漫与漫画资料库", "检索作品、角色、制作信息、评分和关联作品", "database|discovery|manga|anime|character|studio", "动漫搜索、作品百科、推荐页", "关注地区可用性、语言和作品 ID 对齐"],
    ["anime-tracking", "观看进度与收藏同步", "同步用户看过、想看、评分和追番进度", "tracking|sync|tracker|list", "追番应用、跨平台收藏", "通常需要 OAuth，关注写入权限和冲突合并"],
    ["anime-streaming", "动漫播放源与流媒体", "发现可播放作品、剧集和流媒体入口", "streaming|episode|watch", "聚合播放导航、剧集更新提醒", "重点核对版权、地区限制和链接有效期"],
    ["anime-images", "动漫图片与角色动作素材", "获取角色图片、头像、表情和角色扮演动图", "images?|waifu|neko|gif|roleplaying", "聊天机器人、头像生成、互动反馈", "必须加入 NSFW 过滤和素材许可检查"],
    ["anime-quotes-news", "动漫台词、事实与行业新闻", "获取作品台词、趣味事实和行业资讯", "quotes?|facts?|news", "每日内容、知识问答、资讯栏目", "关注出处、翻译质量和去重"]
  ],
  "Anti-Malware": [
    ["url-reputation", "网址与域名安全检测", "判断 URL、域名是否为恶意、钓鱼或被列入黑名单", "url|domain|safe browsing|phish|link.*flag|reputation", "邮件链接检测、浏览器防护、内容审核", "结果应多源交叉验证并记录更新时间"],
    ["ip-reputation", "IP 信誉与滥用检测", "检查 IP 是否关联扫描、垃圾邮件、攻击或僵尸网络", "ip.*reputation|abuseip|blacklist|abusive ip", "登录风控、WAF、反爬虫", "注意共享 IP 和误报，避免单一信号封禁"],
    ["malware-samples", "恶意样本与威胁情报", "查询恶意文件样本、哈希、家族和情报订阅", "malware samples?|archive|malshare|malwarebazaar|threat intelligence|datasets", "SOC、威胁研究、检测规则生成", "样本下载必须在隔离环境进行"],
    ["sandbox-analysis", "沙箱执行与文件分析", "在隔离环境执行可疑文件并读取行为报告", "sandbox|execution|behavior|analysis", "附件检测、逆向研究、自动化告警", "关注文件隐私、执行时限和报告可解释性"],
    ["file-scanning", "文件与文档病毒扫描", "提交文件或文档并检测病毒、木马和其他威胁", "scan.*file|scan.*document|file.*analysis|virustotal", "上传入口防护、附件网关", "上传前脱敏，确认文件保留和删除政策"]
  ],
  "Art & Design": [
    ["museum-collections", "博物馆与艺术藏品", "搜索艺术品、作者、年代、馆藏和高清图像", "museum|collection|smithsonian|harvard|europeana|art institute", "数字展览、艺术教育、藏品研究", "关注图像许可、署名和开放获取级别"],
    ["color-design", "配色、色板与图案", "生成或检索配色方案、色板、渐变和图案", "color|colour|palette|pattern", "品牌工具、海报生成、主题编辑器", "关注色彩空间、无障碍对比度和导出格式"],
    ["design-portfolios", "设计师与作品发现", "发现设计师、创意作品和作品集", "designer|dribbble|portfolio|creative", "人才发现、灵感库、作品聚合", "关注作者授权、速率限制和内容嵌入规则"],
    ["image-generation", "设计图片与占位图生成", "按尺寸、颜色、文本或模板生成图片", "generate images?|placeholder|dummyimage|image generation", "原型占位、社交图、自动化物料", "关注输出尺寸、字体、缓存和商用许可"],
    ["icons-assets", "图标、Emoji 与视觉资产", "获取图标、Emoji、旗帜和可复用视觉素材", "icon|emoji|logo|favicon|asset", "导航图标、国家选择器、品牌识别", "确认 SVG 安全、品牌商标与署名要求"]
  ],
  "Authentication & Authorization": [
    ["identity-platform", "用户身份与账户管理", "实现注册、登录、会话、用户资料和账户生命周期", "authentication platform|user management|user infrastructure|auth0|stytch", "SaaS 登录、会员系统、多租户应用", "关注数据驻留、账户迁移和供应商锁定"],
    ["passwordless", "免密码与 OTP 登录", "使用短信、邮件一次性验证码或魔法链接登录", "otp|passwordless|magic link", "低摩擦注册、移动端登录", "需要防重放、频控和找回流程"],
    ["authorization", "权限与访问控制", "管理角色、策略、资源权限和授权判断", "authorization|permission|roles?|access control", "后台权限、企业 RBAC/ABAC", "策略变更需要审计与默认拒绝"],
    ["social-oauth", "OAuth 与社会化登录", "接入第三方账户授权和单点登录", "oauth|social login|single sign", "Google/GitHub 登录、企业 SSO", "正确处理 state、PKCE、回调和令牌撤销"]
  ],
  "Blockchain": [
    ["chain-explorer", "链上交易与区块查询", "查询区块、交易、地址余额、事件和合约活动", "block explorer|transaction|blockchain data|onchain|multi-chain data", "区块浏览器、钱包流水、审计工具", "关注确认数、重组、链 ID 和索引延迟"],
    ["rpc-nodes", "节点与 RPC 服务", "通过托管节点读取链状态或广播交易", "node-as-a-service|json-rpc|rpc|node provider", "钱包、DApp 后端、链上监听", "需要多节点容灾、限流和重试幂等"],
    ["smart-contracts", "智能合约与预言机", "部署、调用智能合约或获取链外预言机数据", "smart contract|oracle|chainlink", "DeFi、保险、自动结算", "合约调用前进行安全审计和费用估算"],
    ["defi-dex", "DeFi、DEX 与流动性", "查询代币池、路由、报价、交易和流动性", "dex|defi|liquidity|swap|pool|route execution", "聚合交易、价格比较、流动性分析", "防范滑点、MEV、假币和过期报价"],
    ["nft", "NFT 与数字藏品", "查询 NFT 元数据、集合、所有权和交易", "nft|collectible|token metadata", "藏品展示、资产钱包、市场分析", "处理元数据不可用、侵权素材和链上垃圾资产"],
    ["data-anchoring", "数据存证与时间证明", "把文件哈希或事件锚定到区块链并验证时间", "anchor|chainpoint|proof|timestamp", "电子证据、供应链追溯、版权存证", "明确链上证明只证明存在性，不证明内容真实性"]
  ],
  "Books": [
    ["book-search", "图书搜索与书目发现", "按书名、作者、主题检索图书和版本", "book search|catalog|bibliograph|open library|google books", "书店搜索、阅读清单、图书馆入口", "ISBN、版本、语言和地区信息要分开处理"],
    ["book-metadata", "ISBN 与图书元数据", "查询 ISBN、封面、出版商、页数和分类", "isbn|metadata|cover|publisher", "图书录入、扫码建库、封面展示", "防止把不同装帧版本错误合并"],
    ["full-text", "全文与公共领域阅读", "获取公共领域作品、章节、引文和可阅读文本", "full text|public domain|gutenberg|digital library", "在线阅读、语料研究、朗读工具", "核对作品与译本版权"],
    ["religious-texts", "宗教经典与语义检索", "查询圣经、古兰经、佛经或其他经典章节和译文", "bible|quran|hadith|gita|religious|scripture|tafsir", "经文检索、多语言对照、学习助手", "保留版本、章节编号和译者来源"],
    ["libraries", "图书馆馆藏与借阅", "查找图书馆馆藏、分馆、可借状态和目录记录", "library|libraries|holdings|worldcat", "附近馆藏查询、借阅导航", "可借状态具有时效性，需显示更新时间"],
    ["book-recommendations", "阅读推荐与书评", "基于主题、评分或读者行为推荐图书", "recommend|reviews?|rating|goodreads", "个性化书单、相似作品", "说明推荐依据并避免流行度偏差"]
  ],
  "Business": [
    ["company-enrichment", "企业资料与销售线索", "查询公司规模、融资、行业、域名和关键资料", "company|companies|funding|sales leads?|business data|clearbit", "B2B 销售、供应商尽调、客户补全", "核对数据来源、更新周期和隐私合规"],
    ["domain-intelligence", "企业域名与品牌资产", "搜索注册域名、公司 Logo 和域名关联信息", "domain|logo|registered domain|brand", "品牌识别、域名研究、登录页补全", "Logo 与商标仅用于识别，不代表使用授权"],
    ["business-registry", "企业注册与工商查询", "查询公司注册、税号、法人和经营状态", "registry|registration|company number|cnpj|vat|business lookup", "KYC、供应商准入、合同信息补全", "以官方登记为准并记录查询时间"],
    ["analytics-bi", "商业分析与 BI", "管理仪表盘、数据源、指标和分析结果", "bi dashboard|analytics|superset|business intelligence", "经营看板、内部数据门户", "关注行级权限、缓存和指标口径"],
    ["freelance-services", "自由职业与外包服务", "发布需求、搜索服务者和管理外包任务", "freelancer|hire|gig|services marketplace", "外包平台、专家匹配", "平台条款、支付担保和身份验证是核心"],
    ["charity-nonprofit", "公益组织与慈善查询", "检索非营利组织、资质、项目和捐赠信息", "charity|non-profit|nonprofit", "公益导航、捐赠尽调", "优先使用监管机构或权威登记数据"]
  ],
  "Calendar": [
    ["public-holidays", "公共假日与工作日", "查询各国法定假日、调休和工作日", "public holidays?|holiday|working day|business day", "排班、结算日、跨国日历", "关注国家、地区、年份和临时调休更新"],
    ["observances", "纪念日与文化节日", "获取宗教、文化、行业和趣味纪念日", "observance|national day|liturgical|church calendar|nameday", "内容运营、营销日历、文化提醒", "区分法定假日与非休假纪念日"],
    ["calendar-events", "日历事件管理", "创建、读取和同步日历事件与提醒", "calendar events?|schedule|ical|caldav", "会议安排、个人日程、团队日历", "处理时区、重复规则和冲突"],
    ["date-time", "日期时间与时区计算", "计算日期差、时区、日出日落和特殊日期", "date|time zone|sunrise|sunset|moon", "倒计时、全球会议、天文日历", "统一使用明确时区与 ISO 时间"]
  ],
  "Cloud Storage & File Sharing": [
    ["cloud-files", "云盘文件管理", "上传、下载、移动、共享和管理云端文件", "dropbox|box|cloud storage|file sharing and storage", "企业网盘、附件中心、内容同步", "关注 OAuth 权限、版本、回收站和数据驻留"],
    ["temporary-sharing", "临时文件分享", "生成短期下载链接、到期删除和访问次数限制", "temporary|anonymous|expiration|view limits|file.io", "一次性附件、临时交付", "敏感文件要加密并设置最短保留期"],
    ["file-upload", "文件上传与交付", "提供上传组件、文件接收、转换和 CDN 交付", "file upload|uploader|filestack|upload api", "用户头像、素材库、表单附件", "校验 MIME、大小、病毒和访问权限"],
    ["decentralized-storage", "去中心化存储", "把文件存储到 IPFS 等内容寻址网络", "ipfs|decentralized|content address", "永久内容、链上应用资源", "内容撤回困难，避免上传隐私或侵权资料"]
  ],
  "Continuous Integration": [
    ["ci-pipelines", "构建、测试与发布流水线", "触发和监控代码构建、测试、制品和部署", "continuous integration|continuous delivery|ci/cd|pipeline|build", "自动测试、发布门禁、移动应用构建", "关注并发、缓存、密钥隔离和制品留存"],
    ["build-status", "构建状态与健康告警", "读取构建结果、资源健康、失败日志和状态徽章", "health|status|diagnose|build status", "研发看板、故障通知、发布状态", "区分平台故障与项目自身失败"],
    ["repo-sync", "代码仓库同步与触发", "连接仓库、同步提交并按事件触发流程", "sync.*github|repository|projects", "PR 检查、分支发布", "控制 Webhook 重放和最小仓库权限"]
  ],
  "Cryptocurrency": [
    ["crypto-prices", "币价与市值行情", "获取实时/历史币价、市值、成交量和涨跌幅", "price|market data|market cap|exchange rates?|historical", "行情看板、资产估值、价格提醒", "注明报价货币、交易所来源和更新时间"],
    ["exchange-trading", "交易所与订单交易", "查询订单簿、K 线、交易对并下单", "exchange|trading|order book|orders?|binance|coinbase", "量化交易、交易终端、套利监控", "真实下单必须使用服务端密钥、限额和幂等"],
    ["defi-swaps", "DEX 报价与代币兑换", "比较链上兑换路由、池子、报价和滑点", "dex|swap|liquidity|pool|1inch|0x", "钱包兑换、聚合路由、DeFi 分析", "验证代币地址、报价有效期和最大滑点"],
    ["wallet-portfolio", "钱包余额与投资组合", "聚合地址持仓、交易历史、收益和资产分布", "wallet|portfolio|balances?|holdings?", "加密资产仪表盘、税务导出", "地址公开不等于身份公开，注意隐私推断"],
    ["blockchain-infrastructure", "节点、链上数据与开发基础设施", "访问以太坊等链节点、索引和合约数据", "node-as-a-service|ethereum|blockchain data|rpc|alchemy", "DApp 后端、交易监听", "准备多提供商故障切换和区块重组处理"],
    ["crypto-news", "加密资讯与市场情绪", "获取币圈新闻、社区观点、事件和情绪", "news|sentiment|channel|social", "资讯聚合、舆情分析、事件提醒", "不要把情绪内容直接作为投资建议"],
    ["mining-network", "挖矿与网络指标", "查询算力、难度、区块奖励、Gas 和网络状态", "mining|hashrate|difficulty|gas|halving|block reward", "矿池看板、手续费预测、减半倒计时", "指标受链和数据节点延迟影响"]
  ],
  "Currency Exchange": [
    ["spot-rates", "实时汇率", "查询法币、贵金属或加密货币当前兑换率", "real-time|current|exchange rates?|forex", "多币种标价、财务看板、旅行换算", "注明基准货币、报价时间和数据源"],
    ["currency-conversion", "货币金额换算", "按给定金额在两种货币之间转换", "conversion|convert|calculator", "结账预估、费用换算、国际报价", "换算结果不包含银行点差和手续费"],
    ["historical-rates", "历史汇率与趋势", "获取指定日期或区间的历史汇率", "historical|time series|past rates?", "会计折算、趋势图、回测", "财务用途应使用合规的官方定盘数据"],
    ["central-bank-rates", "央行与官方参考汇率", "读取央行发布的参考汇率和货币数据", "central bank|ecb|official|reference rate", "会计、监管报表、官方换算", "明确发布日期、适用日和节假日处理"]
  ],
  "Data Validation": [
    ["address-validation", "地址校验与标准化", "验证邮政地址、纠错并标准化字段", "address verification|postal|lob", "电商收货、开户、物流下单", "区分可投递验证与仅格式校验"],
    ["tax-validation", "税号与 VAT 校验", "验证企业税号、VAT 和税务登记状态", "vat|tax number|tax id", "跨境结账、供应商 KYC、发票", "记录监管来源和查询时间"],
    ["invoice-validation", "电子发票与格式合规", "校验电子发票结构、标准和必填字段", "invoice|xrechnung|zugferd|factur|peppol", "财务入账、开票网关、合规预检", "结构通过不代表交易真实或税务认可"],
    ["content-validation", "敏感词与内容校验", "识别脏话、淫秽、违规表达或内容风险", "profanity|obscenity|content validator", "评论审核、昵称注册、聊天过滤", "需要多语言、语境和申诉机制"],
    ["schema-validation", "API 与数据结构校验", "检测 Schema 变更、请求格式和下游兼容性", "schema|breaking changes?|preflight|echo|http method", "API 测试、发布门禁、契约测试", "明确兼容性规则和版本策略"]
  ],
  "Development": [
    ["web-scraping", "网页抓取与结构化提取", "抓取网页、搜索结果、商品或动态页面内容", "scrap|crawl|extract.*website|amazon.*scrap|serp", "竞品监测、数据采集、搜索分析", "遵守 robots、站点条款、版权和访问频率"],
    ["screenshots-rendering", "网页截图与渲染", "把 URL、HTML 或组件渲染为图片/PDF", "screenshot|render.*html|url to image|browser", "社交分享图、页面存档、视觉回归", "关注等待条件、字体、视口和隐私页面"],
    ["mock-apis", "Mock API 与请求回显", "生成模拟接口、回显请求或托管临时端点", "mock|fake rest|echo|request bin|beeceptor", "前后端并行、Webhook 调试、自动测试", "不要向公共 Mock 端点发送敏感数据"],
    ["code-execution", "代码执行与编译", "在沙箱中编译、运行代码并返回输出", "compile|execute code|runtime|judge", "在线 IDE、教学、代码评测", "必须限制资源、网络和系统调用"],
    ["qr-barcode", "二维码与条码", "生成、识别二维码、条码和票据编码", "qr|barcode", "登录码、商品扫码、电子票", "签名敏感载荷并防止二维码钓鱼"],
    ["webhooks-automation", "Webhook 与自动化连接", "接收、转发、重试 Webhook 或连接多个服务", "webhook|automation|integrat|workflow", "事件驱动集成、低代码自动化", "验证签名、去重、重试和死信"],
    ["device-user-agent", "设备、浏览器与 User-Agent 识别", "解析 User-Agent、设备、操作系统和客户端能力", "user-agent|device details|browser detection", "风控、兼容提示、流量分析", "UA 可伪造，不应作为唯一身份信号"],
    ["developer-utilities", "开发者通用工具", "提供格式转换、随机数据、元数据、网络与辅助计算", "developer|utility|multiple services|tools?|api", "内部工具箱、原型开发", "先确认能力边界、限流和长期维护状态"]
  ],
  "Dictionaries": [
    ["definitions", "词义、词性与例句", "查询单词定义、词性、例句和用法", "definition|parts? of speech|examples?|dictionary", "阅读助手、写作工具、背词应用", "关注语言、词典版权和义项版本"],
    ["synonyms", "同义词、反义词与词语联想", "查找同义词、反义词、相关词和搭配", "synonym|antonym|thesaurus|related words?", "写作改写、搜索扩展、文案辅助", "按语境和词性筛选，避免机械替换"],
    ["pronunciation", "发音与音标", "获取音标、发音音频和读音信息", "pronunciation|phonetic|audio", "语言学习、无障碍朗读", "关注口音、音频许可和加载失败回退"],
    ["bilingual", "双语词典与翻译释义", "查询两种语言之间的词义对应和解释", "bilingual|translation|translate", "外语学习、跨语言检索", "词典释义不等于句子级翻译"],
    ["historical-language", "古文、字符与历史语料", "查询汉字、古籍、词源和历史文本", "chinese character|pre-modern|etymology|historical|classical", "古籍研究、汉字学习、数字人文", "保留原文版本、异体字和引用出处"]
  ],
  "Documents & Productivity": [
    ["pdf-generation", "PDF 生成", "把 HTML、URL、图片或文本转换为 PDF", "html.*pdf|url to pdf|generate pdf|buildpdf|pdflayer", "发票、报告、证书、网页归档", "检查分页、字体嵌入和打印样式"],
    ["file-conversion", "文件格式转换", "在文档、图片、表格和其他格式之间转换", "file conversion|convert.*file|api2convert", "办公自动化、附件预览、格式兼容", "转换前扫描文件并限制大小和复杂度"],
    ["ocr-extraction", "OCR 与文档信息提取", "从扫描件、票据或图片识别文字和结构", "ocr|extract.*document|scan|invoice data", "票据录入、档案数字化、表格提取", "评估语言、版面、手写体和低清图表现"],
    ["project-management", "任务与项目管理", "创建任务、项目、负责人、截止日期和工作流", "asana|clickup|project management|tasks?", "团队协作、工单同步、项目看板", "关注 OAuth 范围、Webhook 和对象 ID 映射"],
    ["spreadsheets-databases", "表格与轻量数据库", "读写 Airtable、电子表格或结构化工作空间数据", "airtable|spreadsheet|table|database", "运营后台、表单数据、轻量 CRM", "控制字段类型、并发更新和权限"],
    ["esign-forms", "电子签名与表单", "生成、填写、签署和追踪电子文档", "signature|esign|form|document signing", "合同签署、审批、客户表单", "确认身份、审计轨迹和地区法律效力"]
  ],
  "Email": [
    ["email-sending", "事务邮件与批量发送", "发送验证码、通知、账单和营销邮件", "send email|email delivery|transactional|smtp", "注册验证、订单通知、邮件营销", "配置 SPF/DKIM/DMARC、退订和退信处理"],
    ["email-validation", "邮箱地址有效性验证", "检查邮箱语法、域名、MX 和可投递性", "email address validation|validate email|mailboxlayer", "注册清洗、销售线索、退信预防", "避免把 SMTP 探测结果当作用户真实身份"],
    ["disposable-email", "临时邮箱识别", "识别一次性、临时和高风险邮箱域名", "disposable|temporary email|ephemeral", "防滥用注册、优惠券风控", "临时邮箱只是风险信号，需允许申诉"],
    ["mailbox-access", "收件箱与邮件读取", "创建收件箱、收发邮件、读取线程和附件", "inbox|mailbox|receive|jmap|imap", "客服邮箱、AI Agent 邮箱、邮件自动化", "最小化授权并保护邮件正文与附件"],
    ["domain-deliverability", "邮件域名与送达配置", "检查 SPF、DKIM、DMARC、MX 和域名健康", "spf|dkim|dmarc|mx|deliverability", "发信域名体检、反欺诈、运维监控", "DNS 结果需结合传播时间和实际发送测试"]
  ],
  "Entertainment": [
    ["jokes-facts", "笑话、事实与随机娱乐内容", "获取笑话、趣味事实、借口和随机短内容", "joke|fun fact|excuse|buzz words|random", "聊天机器人、每日内容、破冰工具", "加入内容分级、去重和语言过滤"],
    ["astrology", "星座、占星与天象", "生成星盘、星座运势和天象事件", "astrology|natal chart|horoscope|sky events", "星座内容、娱乐测算", "明确属于娱乐内容，不作为医疗或人生决策依据"],
    ["trivia-quotes", "问答、名言与知识娱乐", "提供问答题、名言和竞猜内容", "trivia|quotes?|quiz", "知识竞赛、派对游戏、学习互动", "核对答案、出处和文化偏差"],
    ["lottery", "彩票与抽奖信息", "查询开奖记录、奖池或生成抽奖内容", "lottery|jackpot|draw", "开奖展示、活动抽奖", "遵守地区博彩法规并避免误导"],
    ["creative-ideas", "创意概念与随机灵感", "生成荒诞产品、名字、概念或创意提示", "concept|idea|generated product|creative", "头脑风暴、内容创作、游戏素材", "对生成内容进行版权和安全复核"]
  ],
  "Environment": [
    ["air-quality", "空气质量与污染物", "查询 AQI、PM2.5、臭氧和污染物浓度", "air quality|aqi|pm2|pollution", "健康提醒、城市环境看板", "显示监测站、更新时间和指数标准"],
    ["pollen-allergy", "花粉与过敏风险", "查询花粉种类、浓度和过敏预报", "pollen|allergy", "过敏提醒、户外活动建议", "不能替代医生建议，关注位置粒度"],
    ["carbon-emissions", "碳排放与碳足迹", "估算活动、运输、能源或产品产生的碳排放", "carbon|co2|emission|footprint|offset", "碳核算、绿色出行、ESG 看板", "保留排放因子、边界和计算方法"],
    ["energy-data", "能源、电力与电网", "获取电力生产、用量、价格和能源结构", "energy|electricity|power|grid", "能源看板、用电优化、绿电分析", "区分预测与实测，统一功率/电量单位"],
    ["climate-data", "气候与长期环境数据", "查询长期温度、降水、气候指标和变化趋势", "climate|historical weather|temperature record", "气候研究、风险评估、长期规划", "不要用短期天气数据替代气候数据"],
    ["natural-disasters", "自然灾害与地质事件", "获取地震、火灾、洪水、风暴和灾害告警", "earthquake|wildfire|flood|disaster|hazard", "应急看板、风险通知、保险", "告警需采用权威来源并提供发布时间"],
    ["water-ocean", "水质、海洋与生态环境", "查询水质、水文、海洋和环境监测数据", "water|ocean|marine|hydro|environmental data", "水务监测、海洋研究、生态地图", "关注采样点、深度、单位和质量标记"]
  ],
  "Events": [
    ["event-discovery", "本地活动发现", "按地点、日期和主题搜索活动", "find events?|search events?|eventbrite", "同城活动、旅行推荐、兴趣日历", "关注取消状态、时区和地点准确性"],
    ["tickets-venues", "票务、场馆与演出", "查询票务、场馆、表演者和座位信息", "ticket|venue|performer|attraction|seatgeek", "演出搜索、购票入口、场馆导航", "价格与库存变化快，显示更新时间和跳转来源"],
    ["event-calendar", "会议与行业活动", "发现会议、展会、开发者活动和行业日程", "conference|meetup|festival|expo", "行业日历、参会提醒", "去重同一活动的不同票务来源"]
  ],
  "Finance": [
    ["stock-quotes", "股票实时与历史行情", "查询股票、ETF 的报价、K 线和成交量", "stock data|equities|etfs|market data|intraday|historical", "行情看板、回测、价格提醒", "区分实时/延迟行情并确认交易所授权"],
    ["company-fundamentals", "公司财务与基本面", "获取财报、估值、盈利、公司行动和高管交易", "financial statements?|fundamental|earnings|insider trading|company data", "基本面研究、财报分析", "核对报告期、币种、修订和拆股调整"],
    ["economic-indicators", "宏观经济与央行数据", "获取 GDP、通胀、利率、就业和经济时间序列", "economic|gdp|inflation|interest rate|central bank|macro", "宏观研究、风险模型、数据新闻", "保留发布日期、修订版本和季调口径"],
    ["open-banking", "银行账户与开放银行", "读取账户、余额、交易或发起银行支付", "banking|bank account|transactions?|open bank|payment initiation", "财务聚合、支付、对账", "需要强客户认证、同意管理和敏感数据保护"],
    ["bank-identifiers", "IBAN、SWIFT 与银行识别", "验证银行账号、IBAN、SWIFT/BIC 和机构信息", "iban|swift|bic|bank data|routing number", "跨境付款、收款信息校验", "格式有效不代表账户真实或可收款"],
    ["credit-risk", "信用、贷款与风险评估", "获取信用、贷款、违约或风险相关数据", "credit|loan|risk|mortgage", "授信预审、风险看板、贷款比较", "高风险决策必须满足解释、公平和监管要求"],
    ["trading-brokerage", "券商交易与投资账户", "管理交易账户、订单、持仓和市场数据", "broker|trading|orders?|alpaca|portfolio", "量化交易、自动投资、模拟盘", "密钥只放服务端，设置仓位和损失限制"],
    ["tax-finance", "税务、发票与财务计算", "计算税费、发票、利息或财务指标", "tax|invoice|financial calculator|vat", "结账税费、企业财务、报表辅助", "财税结果需由本地专业规则复核"]
  ],
  "Food & Drink": [
    ["recipes", "食谱搜索与菜谱生成", "按菜名、食材、饮食偏好查询食谱和步骤", "recipe|recipes|meal", "做饭助手、菜单推荐、剩余食材利用", "关注份量、单位、过敏原和版权"],
    ["nutrition", "营养成分与热量分析", "查询食物热量、宏量/微量营养素", "nutrition|calorie|food composition", "饮食记录、健康餐单、商品营养展示", "不同数据库和生熟状态会导致数值差异"],
    ["food-products", "食品与杂货商品数据", "按条码或名称查询包装食品、配料和品牌", "grocery|products?|barcode|food data|chomp", "购物扫描、配料识别、商品库", "配方与包装可能随地区和时间变化"],
    ["restaurants", "餐厅、菜单与外卖", "搜索餐厅、菜单、位置、评价和餐饮服务", "restaurant|menu|food delivery|dining", "附近餐厅、菜单聚合、订餐导航", "营业时间、库存和价格需要实时确认"],
    ["beverages", "咖啡、酒类与饮品", "查询咖啡、鸡尾酒、啤酒、葡萄酒和饮品配方", "coffee|cocktail|beer|wine|drink", "调酒助手、饮品百科、内容推荐", "酒精内容需年龄提示和地区合规"],
    ["food-images", "食物图片与占位素材", "获取随机食物、咖啡或菜品图片", "pictures?|images?|placeholder|baconmockup", "菜单原型、内容配图、加载占位", "确认图片许可，避免图片与真实商品不符"]
  ],
  "Games & Comics": [
    ["game-databases", "游戏资料与内容百科", "查询游戏、角色、物品、地图、任务和世界观", "game data|database|characters?|items?|minecraft|animal crossing", "游戏百科、攻略工具、资料站", "处理游戏版本、DLC 和地区名称差异"],
    ["player-stats", "玩家、比赛与战绩", "获取玩家资料、排行榜、比赛记录和游戏统计", "player|stats|leaderboard|match|battle.net", "战绩查询、电竞分析、排行榜", "遵守玩家隐私和平台 API 政策"],
    ["game-prices", "游戏价格、折扣与赠送", "比较商店价格、折扣、Bundle 和限免", "price|deals?|giveaway|store|barter", "比价网站、愿望单提醒", "统一地区、币种、版本和有效期"],
    ["comics", "漫画、超级英雄与条漫", "查询漫画作品、角色、期刊和图片", "comic|marvel|superhero|xkcd", "漫画百科、每日漫画、角色检索", "关注图片与角色 IP 许可"],
    ["game-servers", "游戏服务器与在线状态", "查询服务器状态、在线玩家和服务器配置", "server|online status|minecraft server", "服务器监控、社区列表", "设置超时和缓存，避免对游戏服造成压力"],
    ["esports", "电竞赛事与联赛", "获取电竞赛程、队伍、比分和选手数据", "esport|tournament|league|competitive", "赛事日历、直播辅助、数据分析", "统一赛事 ID、时区和赛制"],
    ["trivia-game-tools", "游戏题库、随机内容与辅助工具", "提供骰子、卡牌、题库或随机游戏内容", "trivia|dice|card|random|quiz", "派对游戏、桌游助手、聊天机器人", "保证随机策略和内容分级符合用途"]
  ],
  "Geocoding": [
    ["forward-geocoding", "地址转坐标", "把地址、地名或邮编转换为经纬度", "geocoding|address.*coordinate|place.*coordinate", "地址落图、配送定位、门店地图", "关注国家覆盖、屋顶级精度和模糊匹配"],
    ["reverse-geocoding", "坐标转地址", "把经纬度转换为地址、行政区和地点名称", "reverse geocod|reverse.*lookup", "定位展示、照片地点、轨迹标注", "明确坐标系、语言和行政区层级"],
    ["ip-geolocation", "IP 地址定位", "根据 IP 推断国家、城市、经纬度和网络信息", "ip geolocation|reverse ip|identify.*ip|website visitors", "内容本地化、风控、流量分析", "IP 定位只是近似，不能作为精确住址"],
    ["places-search", "地点、POI 与地址补全", "搜索兴趣点、地址建议、城市和地标", "places?|poi|autocomplete|location search", "搜索框联想、附近地点、门店选择", "关注类别、营业状态、去重和语言"],
    ["maps-gis", "地图与 GIS 空间分析", "读取地图瓦片、地理数据并进行空间分析", "gis|map|geospatial|grass", "专题地图、区域分析、可视化", "统一投影、精度和数据许可"],
    ["routing-distance", "路线、距离与行程时间", "计算驾车、步行、骑行路线和距离矩阵", "route|directions?|distance|travel time", "导航、配送调度、通勤估算", "实时交通、车辆限制和收费可能改变结果"],
    ["administrative-areas", "国家与行政区划", "查询国家、省州、城市和边界层级", "countries|states|cities|administrative divisions?|boundaries", "地区选择器、地址标准化、区域统计", "行政区会变更，需要版本和稳定代码"],
    ["timezone-location", "坐标与时区", "根据地点或坐标确定时区和 UTC 偏移", "time zone|timezone|utc offset", "全球日程、本地时间展示", "处理夏令时和历史规则"]
  ],
  "Government": [
    ["laws-regulation", "法律法规与监管追踪", "搜索法律、法规、法案和监管变化", "law|legislation|regulation|bclaws|ai law", "合规监控、政策研究、法规问答", "展示司法辖区、生效日期和官方原文"],
    ["elections-politics", "选举、议员与政治数据", "查询候选人、选区、投票、议员和政治活动", "election|vote|candidate|parliament|congress|politic", "选举看板、选民信息、政治研究", "保持中立，记录来源和更新时间"],
    ["public-finance", "政府预算、采购与公共支出", "查询预算、合同、采购和公共资金流向", "budget|spending|procurement|contract|treasury", "透明政府、采购分析、反腐研究", "区分计划预算、承诺和实际支付"],
    ["census-demographics", "人口普查与社会统计", "获取人口、家庭、教育、就业和地区统计", "census|population|demographic|statistics", "区域画像、公共规划、数据新闻", "关注统计口径、年份和隐私抑制"],
    ["public-services", "公共服务与政务查询", "访问许可证、办事、设施和政府服务信息", "public service|government service|permit|civic", "政务导航、城市服务、便民应用", "链接和资格条件需要定期复核"],
    ["company-government", "官方企业与税务登记", "通过政府数据查询企业、税号和注册状态", "company|cnpj|receita|business registry|tax", "企业尽调、发票、KYC", "以官方查询时间点为证据，不推断持续有效"],
    ["government-open-data", "政府开放数据门户", "发现央行、城市和国家机构发布的数据集", "open data|government data|central bank|city data", "数据目录、公共研究、指标看板", "记录机构、版本、许可和更新频率"]
  ],
  "Health": [
    ["disease-surveillance", "疫情与公共卫生监测", "查询传染病病例、死亡、康复和地区趋势", "covid|coronavirus|disease|cases?|public health", "疫情看板、公共卫生研究", "使用官方定义并标注报告延迟"],
    ["clinical-trials", "临床试验检索", "按疾病、药物、机构和阶段查找临床试验", "clinical trial|clinicaltrials", "患者招募导航、医学研究", "不把登记信息当作疗效结论"],
    ["drugs-medication", "药物、处方与相互作用", "查询药物说明、成分、剂量、不良反应和相互作用", "drug|medication|prescription|pharma|interaction", "用药百科、处方辅助、药品检索", "必须由医疗专业人员复核"],
    ["medical-terminology", "疾病编码与医学术语", "查询 ICD、症状、医学概念和标准术语", "icd|medical terms?|symptom|diagnosis code", "病历结构化、搜索、编码辅助", "区分版本和地区扩展，不自动诊断"],
    ["providers-facilities", "医疗机构与服务提供者", "查找医院、医生、药房和医疗服务", "doctor|hospital|provider|medicare|facility", "就医导航、保险网络查询", "营业和接诊状态需要实时确认"],
    ["fitness-wellness", "健康、运动与生活方式", "记录体征、运动、睡眠、饮食和健康习惯", "fitness|workout|sleep|wellness|health data", "健康看板、习惯管理、可穿戴设备", "健康数据属于敏感信息，最小化收集"],
    ["mental-health", "心理健康资源", "提供心理健康信息、支持资源和服务入口", "mental health|therapy|counsel|stress", "心理支持导航、员工关怀", "危机情况必须引导当地紧急资源"]
  ],
  "Jobs": [
    ["job-search", "职位搜索与聚合", "按关键词、地点、公司搜索公开职位", "job search|job board|job aggregator|vacancies", "招聘搜索、职位提醒、职业门户", "职位可能过期，显示来源和发布日期"],
    ["remote-jobs", "远程与全球职位", "筛选远程、跨国和异地工作机会", "remote|worldwide|europe", "远程职位板、数字游民工具", "核对工作地、时区、签证和薪资地区限制"],
    ["tech-ai-jobs", "技术与 AI 专项招聘", "聚合软件、数据、AI/ML 等技术职位", "ai/ml|engineering|developer|tech jobs?", "垂直招聘、人才情报", "技能标签要标准化并去重重复职位"],
    ["salary-labor", "薪资与劳动力市场", "查询薪资范围、技能需求和就业趋势", "salary|compensation|labor market|employment data", "薪酬基准、职业规划、区域分析", "控制职位级别、地区、币种和样本偏差"],
    ["company-careers", "公司官网职位监测", "从企业招聘页发现新增、关闭和更新职位", "career pages?|companies|company jobs?", "销售信号、招聘监控、人才研究", "尊重招聘网站访问政策并进行去重"]
  ],
  "Machine Learning": [
    ["llm-generation", "大语言模型与文本生成", "生成、续写、问答、对话或结构化文本", "text generation|language model|llm|chat|gpt", "AI 助手、内容生成、信息抽取", "需要提示注入防护、成本预算和输出验证"],
    ["computer-vision", "图像识别与计算机视觉", "识别物体、场景、标签、成人内容和图片描述", "computer vision|image caption|object detection|nsfw|image classification", "图片搜索、审核、无障碍描述", "评估误报、偏差和敏感图像处理"],
    ["face-analysis", "人脸检测与识别", "检测人脸、属性或进行人脸比对", "face recognition|facial|face detection", "身份核验、相册整理", "属于高敏生物识别，必须满足同意和地区法规"],
    ["speech-transcription", "语音识别与转写", "把音频转成文本、时间轴、字幕和说话人", "transcription|speech to text|diarization|srt|vtt|audio", "会议记录、字幕、客服质检", "关注语言、噪声、说话人和敏感录音授权"],
    ["text-to-speech", "文本转语音", "把文本生成自然语音和多语言声音", "text-to-speech|tts|voices?", "朗读、语音助手、无障碍", "注意声音克隆同意和合成内容标识"],
    ["image-generation-ai", "AI 图像生成与处理", "根据文本生成图像、增强、风格化或修复", "image generation|generate images?|deepai|image processing", "创意设计、素材生成、商品图", "检查版权、人物肖像和安全过滤"],
    ["translation-nlp", "翻译与自然语言处理", "翻译、分类、实体识别、摘要和语言理解", "translation|nlp|natural language|language api", "多语言产品、文档处理、文本路由", "建立领域术语表和人工复核"],
    ["moderation", "AI 内容审核", "识别成人、暴力、仇恨、有害或违规内容", "moderation|toxic|nsfw|safety|classification", "社区审核、生成内容网关", "必须有阈值配置、人工复审和申诉"],
    ["ai-infrastructure", "模型托管、推理与成本工具", "托管模型、调用推理端点或估算 Token/能耗成本", "model hosting|inference|token cost|energy|ai economics", "AI 平台、成本看板、模型路由", "比较延迟、上下文、并发、价格和数据保留"]
  ],
  "Music": [
    ["music-catalog", "歌曲、艺人与专辑资料", "搜索歌曲、艺人、专辑、流派和发行信息", "music|artist|album|track|catalog", "音乐搜索、艺人页、资料库", "统一 ISRC/平台 ID、地区和版本"],
    ["music-streaming", "音乐播放与流媒体", "获取试听、播放入口、收藏和播放历史", "streaming|audiomack|deezer|spotify|playback", "音乐播放器、发现页、播放列表", "受版权、地区和用户授权限制"],
    ["lyrics", "歌词与歌曲文本", "查询歌词、时间轴歌词和歌曲文本", "lyrics?|song text", "歌词展示、卡拉 OK、搜索", "歌词通常受版权保护，严格遵守展示许可"],
    ["radio", "电台与在线广播", "发现广播电台、节目和直播流", "radio|broadcast|station", "网络收音机、地区电台导航", "检查流地址有效期和内容地区限制"],
    ["concerts", "演唱会与音乐活动", "查询艺人巡演、音乐节、场馆和日期", "concert|music events?|bandsintown|festival", "演出提醒、旅行规划、票务导航", "时区、取消和场馆变更需及时更新"],
    ["audio-analysis", "音频特征与音乐识别", "分析节奏、调性、音频指纹或识别歌曲", "audio analysis|recognition|fingerprint|tempo|bpm|mastering", "听歌识曲、推荐、自动母带", "音频上传需许可，识别结果需置信度"],
    ["playlists-recommendations", "歌单与音乐推荐", "根据用户、风格或相似度生成歌单和推荐", "playlist|recommend|similar music|discovery", "个性歌单、场景音乐、相似艺人", "说明推荐依据并提供多样性控制"]
  ],
  "News": [
    ["breaking-news", "实时头条与突发新闻", "获取最新全球或地区新闻、头条和快讯", "live news|real-time|headlines?|breaking|latest", "新闻首页、突发提醒、舆情入口", "展示来源、发布时间并避免单源误报"],
    ["news-search", "新闻搜索与主题追踪", "按关键词、主题、语言和日期检索新闻", "search.*news|articles?|topic|metadata", "品牌监测、专题页、研究", "处理转载重复、时间范围和查询语法"],
    ["historical-news", "历史报纸与新闻档案", "搜索历史报纸、旧闻和新闻档案", "historic|archive|newspapers?|chronicling", "历史研究、纪念专题、事实核查", "注意 OCR 误差、版权和年代语境"],
    ["rss-readers", "RSS 与订阅聚合", "管理 Feed、订阅源、文章状态和阅读列表", "rss|feed|feedbin|reader", "个人资讯中心、内容监控", "处理源失效、全文抓取许可和去重"],
    ["industry-news", "行业垂直新闻", "聚合 AI、金融、科技等特定行业资讯", "ai industry|funding|business news|technology|financial news", "行业简报、投资情报、每日摘要", "建立明确主题过滤并保留原文链接"],
    ["fact-checking", "事实核查与媒体可信度", "查询事实核查、声明和来源可信度信息", "fact check|verification|credibility", "内容审核、新闻辅助阅读", "核查结果也需显示机构、方法和日期"]
  ],
  "Open Data": [
    ["dataset-catalogs", "开放数据集目录", "发现数据集、下载入口、元数据和许可证", "dataset|catalog|open data|archive", "数据搜索、研究资料库、RAG 数据源", "优先记录许可证、版本和更新频率"],
    ["demographic-data", "人口与社会统计", "查询人口、教育、经济、住房和社会指标", "population|demographic|census|social data", "区域画像、政策研究、市场分析", "关注统计口径和地理层级"],
    ["geospatial-open-data", "土地、地址与地理开放数据", "获取地块、边界、地址、地图和空间评分", "land|property|geo|map|address|acre", "选址、土地评估、城市规划", "坐标精度和土地结论需专业复核"],
    ["cultural-archives", "文化、历史与互联网档案", "访问互联网档案、历史事实和文化资料", "archive.org|history|cultural|archive", "数字人文、历史展示、长期保存", "检查单项内容许可而非只看平台许可"],
    ["identity-services", "政府数字身份与凭证服务", "访问 KYC、教育、就业等公共数字凭证", "kyc|identity|credential|api setu|employment", "身份核验、证书查询、政务服务", "需要明确用户同意、用途和数据最小化"],
    ["institutional-data", "国际组织与机构数据", "获取政府、国际组织、科研机构发布的指标", "world bank|un|institution|federal|official data", "宏观研究、公共看板、数据新闻", "保留机构代码、时间维度和修订"]
  ],
  "Open Source Projects": [
    ["project-discovery", "开源项目与资源发现", "搜索开放许可项目、作品和公共资源", "openly licensed|public domain|project|catalog|search", "技术选型、开源目录、素材发现", "确认具体仓库许可证和维护状态"],
    ["repo-metrics", "仓库贡献与活跃度", "生成贡献图、活跃度、提交和社区指标", "github contribution|analytics|contributors?|commits?", "开发者主页、开源健康看板", "活跃度不能单独代表质量"],
    ["project-platforms", "开源平台内容与接口", "访问 Drupal 等开源社区的平台对象和内容", "drupal|open source platform|repository", "插件目录、社区整合、内容同步", "注意平台版本和权限范围"],
    ["open-web-tools", "开放 Web 小工具", "提供词语、生成器和可复用社区服务", "word-finding|generator|datamuse|insult", "原型、内容实验、开发小工具", "核对内容安全和稳定性"],
    ["web-analytics", "开源分析与事件数据", "接入开源网站分析、事件和用户指标", "web analytics|countly|event analytics", "自托管分析、产品指标", "避免收集不必要的个人数据"]
  ],
  "Patent": [
    ["patent-search", "专利检索", "按关键词、申请人、发明人和分类搜索专利", "patent search|epo|uspto|tipo", "先前技术检索、竞争情报、研发查新", "机器检索不能替代专业法律检索"],
    ["patent-metadata", "专利元数据与法律状态", "获取申请、公开、授权、引用和法律状态", "patent api|metadata|legal status|citation", "专利档案、监控、组合分析", "法律状态必须以官方登记为准"],
    ["innovation-trends", "创新趋势与专利分析", "分析技术领域、机构、地区和引用网络趋势", "trends?|patterns?|visualize|innovation", "产业研究、技术路线、机构画像", "控制分类、时间窗和同族专利去重"]
  ],
  "Personality": [
    ["quotes-advice", "名言、建议与每日内容", "获取名言、建议、格言和启发性短句", "advice|quotes?|dictum|expressions?", "每日一句、聊天机器人、锁屏内容", "标明作者和出处，过滤不适宜内容"],
    ["astrology-personality", "占星、星盘与人格娱乐", "生成星盘、星座、Human Design 和娱乐性人格内容", "astrology|natal|human design|horoscope|vedic", "个性化娱乐、星座内容", "明确非科学诊断，不用于重要决策"],
    ["name-demographics", "姓名推断年龄、性别与国籍", "根据姓名估算年龄、性别或国家概率", "name|gender|age|nationality|agify|genderize", "表单辅助、统计研究、个性化实验", "属于概率推断，不应用于歧视性决策"],
    ["avatars-placeholders", "头像与个性化占位图", "生成随机头像、食物或人物占位图片", "avatar|placeholder|images?|biriyani", "用户占位头像、原型内容", "避免让随机形象暗示真实身份"],
    ["social-profiles", "社区用户与文章资料", "读取社区用户、文章、标签和互动内容", "dev.to|forem|articles?|users?", "开发者社区、内容聚合", "遵守用户隐私和平台展示规则"],
    ["personality-tests", "人格测试与趣味测评", "提供性格题目、结果或趣味分类", "personality|test|assessment|quiz", "互动问卷、团队破冰", "不用于招聘、医疗或高风险判断"]
  ],
  "Phone": [
    ["phone-validation", "电话号码验证与格式化", "验证号码长度、国家代码、格式和有效性", "phone number validation|validate phone|phone validation", "注册表单、CRM 清洗、国际号码输入", "格式有效不代表号码归属本人"],
    ["carrier-lookup", "运营商、线路与地区查询", "查询运营商、国家、地区和移动/固话类型", "carrier|line type|location|numlookup|veriphone", "短信路由、反欺诈、号码补全", "携号转网会降低运营商结果时效性"],
    ["phone-specs", "手机设备规格", "按品牌和型号查询手机硬件规格", "phone specification|device specs?|mobile specs?", "设备比较、商品资料、维修参考", "区分地区型号和存储版本"],
    ["sms-voice", "短信与语音通信", "发送短信、语音验证码或发起电话", "sms|voice|call|telephony", "验证码、通知、客服", "需要反骚扰、用户同意和发送频控"]
  ],
  "Photography": [
    ["web-screenshots", "网页截图", "将网页 URL 渲染为图片", "url to screenshot|screenshotlayer|screenshot", "页面预览、存档、社交卡片", "设置视口、等待条件和隐私认证处理"],
    ["template-images", "模板化图片与海报生成", "从模板、文字和数据批量生成图片或 PDF", "template|generate images?|bruzu|apitemplate", "营销海报、证书、社交媒体物料", "锁定字体、品牌规范和动态文本溢出"],
    ["image-processing", "图片裁剪、压缩与优化", "调整尺寸、格式、质量、裁剪和压缩", "resize|optimization|compress|image manipulation|processing", "头像处理、响应式图片、CDN", "保留原图、EXIF 处理和质量基线"],
    ["stock-photos", "图库与版权图片搜索", "搜索照片、插画、壁纸和可授权素材", "stock photo|photos?|unsplash|pexels|wallpaper", "内容配图、设计素材、背景图库", "按来源要求署名并核对商业许可"],
    ["image-hosting", "图片上传与托管", "上传、管理和交付图片资源", "image hosting|upload|manage images?", "用户相册、内容管理、图床", "设置访问控制、删除策略和内容审核"],
    ["photo-metadata", "相机与照片元数据", "读取相机型号、EXIF、拍摄地点和照片信息", "camera|exif|photo metadata", "照片整理、设备统计、取证辅助", "默认移除公开图片中的敏感定位信息"]
  ],
  "Programming": [
    ["code-execution", "在线代码执行与编译", "编译运行多语言代码并返回输出和错误", "compile|running code|code execution|judge0", "在线 IDE、教学、自动评测", "必须使用强沙箱、资源配额和网络隔离"],
    ["coding-contests", "编程竞赛与题目", "查询比赛、题目、提交、排名和赛程", "codeforces|competitive|contest|kontests", "竞赛日历、训练平台、选手分析", "统一时区、比赛状态和平台 ID"],
    ["code-documentation", "代码文档生成", "根据代码或注释生成、管理技术文档", "documentation for code|mintlify|code docs?", "SDK 文档、内部知识库", "生成文档需与版本和源码同步"],
    ["developer-solutions", "编程问答与解决方案", "查询技术问题、代码示例和开发知识", "programming questions?|solutions?|stackoverflow|code examples?", "开发搜索、AI 编码辅助", "保留许可证、出处并验证代码安全"]
  ],
  "Science & Math": [
    ["research-papers", "论文与开放学术文献", "搜索论文、作者、摘要、引用和开放全文", "research papers?|arxiv|core|publication|doi", "文献检索、综述、RAG 语料", "保留 DOI、版本和撤稿状态"],
    ["astronomy", "天文、太阳系与观测", "查询恒星、行星、月相、日出日落和天文事件", "astronomy|planet|moon|sun|eclipse|arcsecond", "天文日历、观测助手、教育", "明确观测地点、时区和坐标系统"],
    ["space-missions", "航天任务与太空数据", "获取 NASA 等机构的任务、影像和空间科学数据", "nasa|space|mission|satellite", "航天资讯、卫星可视化、教育", "保留任务、仪器和数据处理级别"],
    ["biodiversity-science", "生物与物种科学数据", "访问生物多样性、基因、物种和生态记录", "gbif|biology|species|genome|biodiversity", "生态研究、生物信息学、物种地图", "使用稳定分类标识并处理同物异名"],
    ["chemistry", "化学物质与元素", "查询元素、化合物、结构、性质和反应信息", "chemistry|chemical|compound|element|molecule", "化学教育、实验资料、材料研究", "危险物质信息需权威安全资料复核"],
    ["math-calculation", "数学计算与公式", "执行数值计算、方程、统计和符号运算", "math|calculate|equation|formula|wolfram", "计算器、作业辅助、工程计算", "显示精度、单位和计算假设"],
    ["equation-rendering", "公式与 LaTeX 渲染", "将 LaTeX/数学公式渲染为图片或矢量文件", "latex|render.*equation|codecogs", "教学内容、报告、公式预览", "对输入做长度限制和命令安全过滤"],
    ["units-measurements", "单位、常数与测量换算", "查询科学常数并进行单位换算", "unit|measurement|constant|conversion", "工程工具、科学计算、教育", "保留量纲、有效数字和单位体系"]
  ],
  "Security": [
    ["vulnerabilities", "漏洞与 CVE 情报", "查询 CVE、受影响版本、漏洞评分和修复信息", "cve|vulnerabilit|security advisory|exploit", "漏洞管理、SBOM 扫描、补丁优先级", "合并多源信息并关注已利用状态"],
    ["internet-assets", "互联网资产与暴露面", "搜索公网主机、端口、服务、证书和设备", "internet connected|host|ports?|censys|binaryedge|scanning platform", "攻击面管理、资产发现、研究", "仅扫描获授权资产并遵守服务条款"],
    ["breach-data", "数据泄露与账号暴露", "检查邮箱、域名或凭据是否出现在泄露事件", "breach|leak|pwned|compromised", "账户安全提醒、企业域监测", "不要返回或保存泄露密码原文"],
    ["tls-certificates", "TLS 证书与域名安全", "检查证书、TLS 配置、DNS 和 HTTPS 风险", "certificate|tls|ssl|dns|domain security", "站点安全体检、证书到期提醒", "处理证书链、SNI 和扫描时间"],
    ["fraud-bot", "欺诈、机器人与设备风险", "检测机器人、异常设备、代理和欺诈行为", "bot detection|fraud|rooted devices?|proxy|risk", "注册风控、反刷、支付风控", "组合多信号并提供误判申诉"],
    ["password-security", "密码与密钥安全", "管理密码、检查强度或生成安全随机值", "password|bitwarden|credential|secret", "密码管理、注册强度检查", "绝不把明文密码发送给不可信服务"],
    ["bug-bounty", "漏洞报告与安全项目管理", "管理漏洞赏金、报告、状态和研究人员协作", "bugcrowd|bug bounty|reported issues?|vulnerability report", "安全响应、漏洞工单、赏金平台", "保护未修复漏洞详情并保留审计"],
    ["threat-intelligence", "威胁情报与信誉", "聚合 IP、域名、文件、攻击组织和 IOC", "threat intelligence|reputation|ioc|indicator", "SOC 告警富化、狩猎、封禁策略", "记录情报时间、置信度和来源"]
  ],
  "Shopping": [
    ["product-catalog", "商品目录与详情", "搜索商品、分类、规格、图片和库存", "products?|catalog|categories|inventory", "电商搜索、商品库、AI 购物助手", "统一 SKU、变体、地区和数据更新时间"],
    ["price-comparison", "价格、库存与优惠", "比较商家价格、库存、促销和购买选项", "price|deals?|buying options?|offers?|availability", "比价、降价提醒、采购", "价格变化快，需要时间戳和最终跳转确认"],
    ["marketplaces", "电商平台交易", "接入 eBay 等市场的商品发布、购买和订单", "ebay|marketplace|sell and buy|commerce", "多渠道刊登、订单同步", "处理 OAuth、平台费、退货和库存冲突"],
    ["product-reviews", "商品评价与口碑", "获取商品评论、评分和用户反馈", "reviews?|rating|amazon reviews", "选购辅助、舆情分析、摘要", "识别重复、激励评论和样本偏差"],
    ["barcode-shopping", "条码与商品识别", "通过 UPC/EAN/条码识别商品", "barcode|upc|ean|scan", "扫码比价、库存录入、食品识别", "同条码在地区和包装版本上可能不同"],
    ["stores-locations", "门店与到店服务", "查询实体门店、位置、营业时间和服务", "stores?|shop location|retail location", "门店导航、到店自提、区域库存", "营业时间和库存需实时确认"]
  ],
  "Social": [
    ["social-publishing", "多平台内容发布", "发布文字、图片、视频并管理多个社交账户", "post|publish|social media api|ayrshare|update.*content", "社媒运营、定时发布、品牌账号管理", "最小化 OAuth 权限并处理平台审核"],
    ["social-analytics", "社交数据与互动分析", "获取粉丝、互动、帖子表现和趋势", "analytics|engagement|followers?|insights?", "运营看板、活动复盘、创作者工具", "区分公开指标和受限用户数据"],
    ["social-profiles", "用户、主页与社交图谱", "查询用户资料、关注关系和公开内容", "users?|profiles?|followers?|social network", "用户主页、身份补全、社区发现", "遵守隐私设置和平台数据保留规则"],
    ["communities-forums", "社区、论坛与讨论", "读取论坛、社区帖子、评论和版块", "forum|community|4chan|reddit|discussion", "社区聚合、话题研究、内容检索", "加入敏感内容审核和删除同步"],
    ["blogging", "博客与内容管理", "读取和更新博客文章、标签和评论", "blogger|blog|articles?|content", "博客客户端、内容迁移、聚合", "保留作者、发布时间和格式"],
    ["team-messaging", "团队消息与协作", "发送消息、管理空间、频道和协作对象", "team collaboration|messaging|chat|cisco spark|slack", "通知机器人、团队自动化", "验证 Webhook、权限和消息隐私"],
    ["decentralized-social", "去中心化社交协议", "访问 AT Protocol 等开放社交网络数据", "decentralized social|bluesky|at protocol|fediverse|mastodon", "跨客户端、开放社交搜索", "处理实例差异、内容删除和身份迁移"]
  ],
  "Sports & Fitness": [
    ["live-scores", "实时比分与赛程", "查询比赛日程、实时比分、结果和比赛状态", "score|fixtures?|schedule|live|league|cups?", "比分应用、赛程提醒、赛事看板", "统一时区、延期、加时和赛事状态"],
    ["teams-players", "球队、球员与统计", "获取球队、球员、阵容、排名和技术统计", "team|player|statistics?|standings?|nba|football", "球队页、球员分析、梦幻体育", "区分赛季、赛事和常规/季后赛"],
    ["sports-odds", "赔率、概率与预测", "获取赔率、胜率模型和市场变化", "odds|probabilit|bet|prediction", "比赛预测、市场观察", "遵守博彩法规并明确非保证结果"],
    ["workouts", "训练动作与健身计划", "获取锻炼动作、训练计划和肌群信息", "workout|exercise|fitness plan|gym", "健身应用、训练课程、动作库", "提供动作安全提示和个体差异说明"],
    ["activity-tracking", "跑步、骑行与运动记录", "读取路线、距离、配速、心率和活动历史", "running|cycling|activity|strava|fitness tracking", "运动日志、挑战赛、可穿戴数据", "位置和健康数据需要明确授权"],
    ["bike-sharing", "共享单车与城市骑行", "查询单车站点、车辆和可用数量", "city bikes?|bike sharing|bicycle", "城市出行、站点地图", "可用数量变化快，需要短缓存"],
    ["sports-news", "体育资讯与赛事内容", "获取体育新闻、赛事文章和媒体内容", "sports news|articles?|news", "体育资讯、球队动态", "保留来源并区分报道和官方结果"]
  ],
  "Test Data": [
    ["fake-people", "虚拟用户与身份数据", "生成姓名、邮箱、头像、生日和用户资料", "fake.*user|random user|identity|people|profile", "注册流程测试、CRM 原型、UI 列表", "仅用于测试，不要与真人身份混用"],
    ["fake-addresses", "虚拟地址与地理数据", "生成国家、城市、街道、邮编和坐标", "addressmock|fake.*address|random.*address|zip", "结账测试、物流表单、地图原型", "避免把随机地址发送到真实物流系统"],
    ["lorem-text", "随机文本与词语", "生成 Lorem Ipsum、单词、句子和段落", "lorem|ipsum|random words?|text", "排版测试、内容占位、搜索测试", "加入极端长度和多语言测试数据"],
    ["avatars-images", "测试头像与占位图片", "生成随机头像、图片、尺寸和视觉占位", "avatar|placeholder images?|dicebear|random image", "用户列表、卡片、图片加载测试", "测试无图、坏图和慢图状态"],
    ["fake-commerce", "虚拟商品、订单与支付数据", "生成商品、价格、购物车、银行卡和订单", "products?|commerce|payment|credit card|orders?|dummyjson", "电商原型、支付沙箱、数据管道", "使用明确测试卡号，绝不生成可用凭据"],
    ["mock-rest", "通用虚拟 REST 数据", "提供可读写的模拟资源、帖子、评论和 Todo", "fake rest|mock api|posts|comments|todos|fakejson", "前端联调、CRUD 教学、自动测试", "不要依赖公共 Mock 数据持久保存"]
  ],
  "Text Analysis": [
    ["language-detection", "语言检测", "识别文本使用的语言和置信度", "language detection|detect language|languagelayer", "自动路由翻译、多语言审核、内容标签", "短文本和混合语言需设置低置信度回退"],
    ["sentiment", "情感与观点分析", "判断文本正负情绪、强度和主观性", "sentiment|opinion|emotion", "评论分析、客服质检、品牌舆情", "讽刺、方言和领域语境会显著影响结果"],
    ["entities-keywords", "实体、关键词与主题提取", "提取人物、组织、地点、关键词和主题", "entity|keyword|topic|information retrieval", "新闻结构化、搜索索引、知识图谱", "保留文本证据和实体消歧"],
    ["summarization", "摘要与关键信息压缩", "把长文本压缩为摘要、要点或标题", "summar|abstract|key points?", "资讯摘要、会议纪要、文档预览", "重要事实需回链原文并防止遗漏"],
    ["translation", "机器翻译", "在多种语言间翻译句子和文档", "translation|translate", "多语言产品、客服、内容本地化", "法律、医疗和品牌文本需要人工审校"],
    ["moderation", "文本审核与毒性检测", "识别仇恨、辱骂、色情、垃圾和违规文本", "toxic|profanity|moderation|abuse|obscene", "评论审核、聊天安全、昵称过滤", "阈值按场景调整并提供复审"],
    ["grammar-style", "语法、拼写与可读性", "检查语法、拼写、风格和文本可读性", "grammar|spelling|readability|writing", "写作助手、编辑器、教育", "不要自动覆盖专有名词和作者风格"],
    ["speech-text", "语音合成与文本声音化", "把文本生成多语言声音或朗读", "text-to-speech|voices?|audexum", "无障碍、播报、语音内容", "标记合成语音并尊重声音授权"]
  ],
  "Tracking": [
    ["shipment-tracking", "快递与包裹追踪", "查询运单轨迹、状态、预计送达和异常", "shipment|track.*package|aftership|orders?|correios", "订单物流、到货通知、客服", "承运商状态映射和时间需标准化"],
    ["postal-lookup", "邮编与地址查询", "通过邮编查询地区、地址和邮政信息", "postal|pincode|zip code|postcode", "地址补全、配送区域判断", "邮编不一定对应唯一地址"],
    ["habit-tracking", "习惯、目标与投入记录", "记录习惯、努力、打卡和个人进度", "habit|effort|routine|pixela", "习惯应用、学习打卡、个人看板", "提供数据导出和时区一致性"],
    ["map-tracking", "地图、路线与位置追踪", "展示位置、轨迹、方向和地理编码", "maps?|directions?|geocoding|location tracking", "车辆轨迹、外勤、路线回放", "位置数据需要同意、最短保留和访问控制"],
    ["delivery-preparation", "物流下单与运单准备", "创建运单、标签、包裹信息和配送请求", "prepare shipments?|shipping label|delivery", "电商履约、仓库发货", "校验地址、重量、危险品和幂等下单"]
  ],
  "Transportation": [
    ["flights-status", "航班状态与航空数据", "查询航班起降、延误、航线、机场和飞机位置", "flight|aviation|airborne|aircraft|airport|ads-b", "航班追踪、接机提醒、机场看板", "区分计划/预计/实际时间并统一时区"],
    ["travel-search", "机票、酒店与旅行搜索", "搜索航班、酒店、目的地和旅行产品", "travel search|amadeus|hotel|booking|fare", "旅行比价、行程规划、AI 旅行助手", "价格和库存需跳转前重新确认"],
    ["public-transit", "公交、地铁与公共交通", "查询线路、站点、时刻、到站和运营状态", "public transport|transit|metro|bus|gtfs|subway", "通勤规划、实时到站、城市出行", "处理 GTFS 时区、临时停运和无障碍信息"],
    ["rail", "铁路与火车", "查询车站、列车时刻、车次、票价和延误", "train|rail|railway", "铁路时刻、换乘、旅行计划", "跨运营商车次和时区需要统一"],
    ["road-traffic", "道路交通与路况", "获取拥堵、事故、道路封闭和行程时间", "traffic|road|incidents?|congestion|driving", "导航、配送调度、交通看板", "数据时效和覆盖路网是关键"],
    ["micromobility", "共享单车、滑板车与微出行", "查询共享车辆、站点、电量和可用性", "bike|scooter|micromobility|city bikes?", "附近车辆、换乘建议", "实时数量短缓存，注意禁停区"],
    ["maritime", "船舶、港口与海运", "查询 AIS 船位、港口、航线和船舶信息", "vessel|marine|maritime|ais|ship", "船舶追踪、港口物流、海事研究", "AIS 可能延迟或关闭，不能替代航行安全系统"],
    ["ride-hailing", "出租车、网约车与共享出行", "估算车辆、价格、路线或叫车服务", "taxi|ride|uber|lyft|car sharing", "叫车聚合、费用预估、出行助手", "最终价格、车辆和地区服务需实时确认"]
  ],
  "URL Shorteners": [
    ["short-links", "短链接生成", "把长 URL 转换为短链接并支持跳转", "url shortener|shorten|short url", "营销链接、二维码、消息分享", "防止开放重定向、钓鱼和滥用"],
    ["link-management", "品牌链接与链接管理", "管理自定义域名、别名、到期和目标地址", "link management|branded|custom|bitly", "品牌短链、活动管理、渠道链接", "设置域名验证、权限和链接生命周期"],
    ["click-analytics", "点击统计与归因", "统计点击、来源、地区、设备和转化", "monitor|analytics|click|optimize.*links?", "营销归因、A/B 链接、渠道分析", "遵守隐私法规并过滤机器人点击"]
  ],
  "Vehicle": [
    ["vin-specs", "VIN 与车辆规格", "通过 VIN、品牌或车型查询配置、年份和参数", "vin|vehicle specs?|carvector|configuration", "二手车录入、车型比较、维修资料", "区分市场版本并验证 VIN 校验位"],
    ["vehicle-pricing", "车辆估值与市场价格", "查询新车/二手车价格、指导价和历史估值", "pricing|price|kelley|fipe|valuation", "二手车估值、保险、采购", "价格受地区、里程、车况和时间影响"],
    ["recalls-maintenance", "召回、故障码与维修", "查询召回、DTC 故障码、保养和维修资料", "recall|dtc|maintenance|repair", "车主提醒、维修助手、售后", "安全问题应以厂商和监管机构为准"],
    ["connected-car", "车联网与远程车辆", "读取遥测、位置、里程并远程控制车辆功能", "telematics|remote.*vehicle|vehicle functions?|connected car", "车队管理、车主应用、远程诊断", "属于高敏控制能力，需要强认证和命令确认"],
    ["dealers-services", "经销商、维修店与服务网点", "按位置查找经销商、维修店和服务设施", "dealer|body shop|service center|directory", "维修导航、售后预约、门店搜索", "营业、资质和服务范围需要确认"],
    ["charging-fuel", "充电站与燃料", "查询 EV 充电站、油站、燃料价格和可用性", "charging|ev|fuel|gas station", "新能源出行、加油/充电导航", "接口类型、功率、实时占用和价格是核心"]
  ],
  "Video": [
    ["movies-tv-catalog", "电影、电视剧与节目资料", "查询作品、剧集、演员、评分和播出信息", "movie|tv|show|episode|series|catalog|imdb", "影视搜索、追剧、作品百科", "统一作品 ID、季集编号和地区译名"],
    ["streaming-availability", "流媒体可看平台", "查询某作品在哪个平台、地区可以观看", "streaming|watch providers?|availability|where to watch", "观影导航、订阅管理", "版权地区和上下架变化频繁"],
    ["video-platforms", "视频平台内容与频道", "访问 YouTube 等平台的视频、频道、播放列表和统计", "youtube|vimeo|video platform|channel|playlist", "视频搜索、创作者工具、数据看板", "遵守 OAuth、配额和嵌入政策"],
    ["video-processing", "视频转换、剪辑与处理", "转码、裁剪、压缩、合成和生成视频", "convert|transcode|edit|process|render video", "短视频生产、上传处理、媒体管线", "评估编码、分辨率、时长、成本和版权"],
    ["live-streaming", "直播与实时视频", "创建、发现或管理直播流和实时事件", "live stream|livestream|broadcast", "活动直播、监控、直播聚合", "处理推流认证、延迟、录制和内容审核"],
    ["subtitles-transcripts", "字幕、台词与转写", "获取或生成字幕、对白、时间轴和文字稿", "subtitle|caption|transcript|quotes?", "无障碍字幕、视频搜索、内容摘要", "保持时间轴并核对字幕版权"],
    ["video-download-metadata", "视频链接解析与元数据", "解析视频链接、封面、时长、格式和下载信息", "download|metadata|thumbnail|duration|video url", "内容导入、链接预览、媒体管理", "下载能力必须遵守平台条款和版权"]
  ],
  "Agriculture": [
    ["agroclimate-irrigation", "农业气象、灌溉与农时", "查询农业气候、土壤温湿度、降水、太阳辐射、积温和参考蒸散 ET0", "agroclimat|agricultural (?:climate|weather)|soil (?:temperature|moisture)|evapotranspiration|ET0|precipitation|solar radiation", "灌溉排程、播种窗口、霜冻/干旱提醒、温室管理", "格点天气不等于田间传感器；按田块、作物和土壤做本地校准"],
    ["soil-properties", "土壤属性与适种评估", "查询坐标或地块的土壤 pH、有机碳、氮、黏土、砂土、粉砂、容重与土层", "soil (?:properties|survey|data)|\\bpH\\b|organic carbon|clay|sand|silt|nitrogen|bulk density", "土壤地图、适种分析、采样规划、施肥前评估", "区分实测与模型预测，保留深度、分辨率和不确定性"],
    ["production-statistics", "作物产量、面积与生产统计", "查询作物种植面积、收获面积、单产、总产量及农场生产统计", "crop production|agricultural production|production statistics|commodity, location and time|farm economics", "产量看板、区域对比、供给研究、产业规划", "统一商品分类、单位、统计周期，并区分调查值与估算值"],
    ["livestock-statistics", "畜牧、乳业与养殖统计", "查询牲畜存栏、屠宰、乳制品、饲养和畜牧市场统计", "livestock|dairy|animals?|cattle|poultry|milk", "养殖产业分析、饲料需求预测、畜产品供给看板", "关注物种、用途、统计口径、地域和时间粒度"],
    ["agri-market-prices", "农产品价格、交易量与市场报告", "查询粮食、畜牧、乳业、果蔬等农产品价格、交易量、贸易与市场报告", "commodity market|market reports?|prices?, volume|trade data|agricultural trade|food balance", "采购报价、产销行情、供应链监测、价格研究", "报价可能按报告、等级、市场和单位组织，不能直接混合比较"],
    ["plant-pest-data", "作物病虫害、寄主与植物检疫", "查询农林有害生物分类、寄主植物、地理分布、检疫状态和植物保护资料", "crop pest|plant pest|pest taxonomy|host plants?|quarantine|plant protection|EPPO", "病虫害知识库、检疫查询、风险清单、植保辅助", "物种识别和处置应由植保专家复核，并以当地官方检疫要求为准"],
    ["plant-identification", "作物与植物图像识别", "通过叶、花、果实或树皮照片识别植物和作物物种并返回候选与置信度", "plant (?:and crop species )?identification|leaf, flower, fruit|confidence scores", "田间识别、园艺助手、物种记录、教育应用", "图像结果是候选而非确诊；需要清晰多角度照片和人工复核"],
    ["satellite-crop-monitoring", "农田遥感、长势与灾情监测", "检索卫星影像，用于作物长势、植被指数、地块变化、旱情和洪涝分析", "satellite earth observation|Sentinel|crop monitoring|vegetation indices|field change|drought analysis", "NDVI 长势看板、地块巡查、灾损评估、农业保险", "影像检索不等于分析结果；还需云掩膜、波段处理、地块边界和算力"],
    ["food-security-indicators", "粮食安全与农业发展指标", "查询国家或地区的粮食生产、农业用地、谷物单产、化肥、水资源与农业增加值", "food security|food production|agricultural land|cereal yield|fertilizer|agriculture value-added|emissions", "粮食安全研究、国家对比、可持续农业与政策看板", "宏观指标不能替代实时或田块数据；必须保留指标代码、单位和来源"],
    ["agri-reports-policy", "农业经济报告、机构与政策资料", "检索农业经济出版物、统计报告、发布记录和机构元数据", "agricultural economics publications|report releases|agencies|ESMIS", "行业研究、报告订阅、政策资料库、知识检索", "API 多返回文献元数据；报告正文和结构化数值可能需要另行解析"]
  ],
  "Weather": [
    ["current-weather", "实时天气实况", "查询当前温度、体感、湿度、风、云量和天气状况", "current weather|real-time weather|weather conditions?|current conditions?|observations?", "天气卡片、城市看板、出行提示", "关注观测站距离、更新时间和分钟级额度"],
    ["weather-forecast", "短期与逐小时天气预报", "查询未来小时/天的温度、降水、风和天气变化", "forecast|hourly|daily weather|7 day|weather and forecast", "未来七天天气、通勤提醒、活动计划", "比较预报时长、小时粒度和更新频率"],
    ["historical-weather", "历史天气与回溯", "查询过去日期的温度、降水、风和观测记录", "historical|past weather|weather history|archive", "事件复盘、保险、能源回测", "区分观测值、再分析数据和插值"],
    ["severe-alerts", "灾害性天气预警", "获取暴雨、台风、雷暴、龙卷风、暴雪等官方告警", "alerts?|warnings?|severe|storm|hurricane|typhoon|tornado", "应急通知、户外安全、保险风控", "优先使用官方告警，保留生效范围和时间"],
    ["precipitation-radar", "降水雷达与天气地图", "获取雷达、卫星、降水图层和可视化瓦片", "radar|satellite|weather map|precipitation map|tiles", "天气地图、降雨动画、路线叠层", "关注图层时间、投影、颜色图例和授权"],
    ["air-quality-weather", "空气质量与天气联合", "查询 AQI、污染物、能见度和气象关联指标", "air quality|aqi|pollution|visibility", "健康提醒、城市环境、户外建议", "AQI 标准因国家而异，显示监测站和更新时间"],
    ["marine-weather", "海洋、潮汐与航海天气", "查询浪高、海温、潮汐、海流和海上风况", "marine|tide|wave|ocean|sea weather|surf", "航海、冲浪、钓鱼、海上作业", "不能替代官方航海警报和现场判断"],
    ["astronomy-weather", "天文观测天气", "提供云量、透明度、视宁度、月相和天文观测条件", "astro|astronomy|stargaz|moon phase|seeing|transparency|7timer", "观星计划、摄影、天文台排程", "需结合光污染、云量和地点海拔"],
    ["agriculture-weather", "农业与种植天气", "查询土壤、蒸散、霜冻、积温和农业气象指标", "agri|soil|evapotranspiration|frost|growing|crop", "灌溉、种植计划、霜冻预警", "需要田块级位置、作物模型和本地校准"],
    ["solar-energy-weather", "太阳辐射与能源天气", "查询太阳辐射、日照、光伏发电和能源相关天气", "solar|irradiance|radiation|photovoltaic|energy weather", "光伏预测、建筑能耗、能源调度", "关注云量模型、面板角度和历史校准"]
  ]
};

const slugify = (value) => value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function normalizeDefinition(category, row) {
  const [slug, name, description, pattern, products, selection] = row;
  return enrichScenarioDefinition({
    id: `${slugify(category)}--${slug}`,
    name,
    description,
    category,
    categoryLabel: CATEGORY_LABELS[category] || category,
    pattern,
    products,
    selection,
    general: false
  });
}

const explicitDefinitions = Object.entries(RAW).flatMap(([category, rows]) => rows.map((row) => normalizeDefinition(category, row)));

const generalDefinitions = Object.keys(CATEGORY_LABELS).map((category) => enrichScenarioDefinition({
  id: `${slugify(category)}--general`,
  name: `${CATEGORY_LABELS[category]}综合能力`,
  description: `该 API 属于“${CATEGORY_LABELS[category]}”，但目录说明不足以可靠归入更具体的业务场景。`,
  category,
  categoryLabel: CATEGORY_LABELS[category],
  pattern: "",
  products: `${CATEGORY_LABELS[category]}综合检索、原型实验或数据补充`,
  selection: "先打开原始文档，确认端点、数据字段、额度、许可与真实业务边界。",
  general: true
}));

export const SCENARIO_DEFINITIONS = [...explicitDefinitions, ...generalDefinitions];
const definitionsByCategory = new Map(Object.keys(CATEGORY_LABELS).map((category) => [category, SCENARIO_DEFINITIONS.filter((item) => item.category === category)]));
const definitionsById = new Map(SCENARIO_DEFINITIONS.map((item) => [item.id, item]));

function matchDefinition(text, definition) {
  if (!definition.pattern) return null;
  const expression = new RegExp(definition.pattern, "gi");
  const matches = [...text.matchAll(expression)].map((match) => match[0].trim()).filter(Boolean);
  if (!matches.length) return null;
  const evidence = [...new Set(matches.map((value) => value.toLowerCase()))].slice(0, 4);
  return {
    id: definition.id,
    name: definition.name,
    confidence: Math.min(0.98, 0.68 + evidence.length * 0.08),
    evidence
  };
}

export function enrichEntriesWithScenarios(entries) {
  return entries.map((entry) => {
    const text = `${entry.name} ${entry.description}`;
    const definitions = definitionsByCategory.get(entry.category) || [];
    const matches = definitions
      .filter((definition) => !definition.general)
      .map((definition) => matchDefinition(text, definition))
      .filter(Boolean)
      .sort((a, b) => b.confidence - a.confidence || a.name.localeCompare(b.name, "zh-CN"))
      .slice(0, 3);
    if (!matches.length) {
      const fallback = definitions.find((definition) => definition.general);
      matches.push({ id: fallback.id, name: fallback.name, confidence: 0.45, evidence: ["分类兜底"] });
    }
    return { ...entry, scenarios: matches };
  });
}

export function buildScenarioSummary(entries) {
  const scenarioItems = new Map();
  for (const entry of entries) {
    for (const match of entry.scenarios) {
      if (!scenarioItems.has(match.id)) scenarioItems.set(match.id, []);
      scenarioItems.get(match.id).push({ entry, match });
    }
  }

  const scenarios = [...scenarioItems.entries()].map(([id, items]) => {
    const definition = definitionsById.get(id);
    const candidates = items
      .sort((a, b) => (b.match.confidence * 100 + b.entry.score) - (a.match.confidence * 100 + a.entry.score) || a.entry.name.localeCompare(b.entry.name))
      .slice(0, 6)
      .map(({ entry, match }) => ({
        id: entry.id,
        name: entry.name,
        description: entry.description,
        url: entry.url,
        score: entry.score,
        tier: entry.tier,
        useMode: entry.useMode,
        auth: entry.auth,
        https: entry.https,
        cors: entry.cors,
        sourceType: entry.sourceType,
        sourceName: entry.sourceName,
        officialDocs: entry.officialDocs,
        provider: entry.provider,
        verifiedAt: entry.verifiedAt,
        coverage: entry.coverage,
        limitations: entry.limitations,
        confidence: match.confidence,
        reason: match.evidence[0] === "分类兜底" ? "仅按上游分类归入，需先阅读文档" : `目录说明命中：${match.evidence.join("、")}`
      }));
    return {
      ...definition,
      group: items[0].entry.group,
      apiCount: items.length,
      browserDirect: items.filter(({ entry }) => entry.useMode === "浏览器直连候选").length,
      backendManaged: items.filter(({ entry }) => ["后端代理", "OAuth 集成"].includes(entry.useMode)).length,
      averageScore: Math.round(items.reduce((sum, { entry }) => sum + entry.score, 0) / items.length),
      topCandidates: candidates
    };
  }).sort((a, b) => b.apiCount - a.apiCount || a.name.localeCompare(b.name, "zh-CN"));

  const specificApiCount = entries.filter((entry) => entry.scenarios.some((scenario) => !definitionsById.get(scenario.id)?.general)).length;
  return {
    totalScenarios: scenarios.length,
    explicitDefinitions: explicitDefinitions.length,
    specificApiCount,
    fallbackApiCount: entries.length - specificApiCount,
    scenarios,
    dataCatalog: buildDataCatalog(entries, scenarios)
  };
}

export function scenarioDefinition(id) {
  return definitionsById.get(id);
}
