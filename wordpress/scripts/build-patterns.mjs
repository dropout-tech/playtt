import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const theme = path.join(root, 'lets-play');
const coaches = JSON.parse(await readFile(path.join(root, 'content/coaches.json'), 'utf8')).filter(coach => !coach.pendingIdentity);
const line = 'https://line.me/R/ti/p/@869usyqy';
const escape = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const href = p => `<?php echo esc_url( home_url( '${p}' ) ); ?>`;
const asset = n => `<?php echo esc_url( get_theme_file_uri( 'assets/images/${n}' ) ); ?>`;
const block = (name, attrs, html) => `<!-- wp:${name}${Object.keys(attrs).length ? ' ' + JSON.stringify(attrs) : ''} -->\n${html}\n<!-- /wp:${name} -->\n`;
const self = (name, attrs) => `<!-- wp:${name} ${JSON.stringify(attrs)} /-->\n`;
const group = (cls, html, tag='div') => block('group', { ...(tag !== 'div' ? {tagName:tag}:{}), className:cls, layout:{type:'default'} }, `<${tag} class="wp-block-group ${cls}">${html}</${tag}>`);
const p = (text, cls='') => block('paragraph', cls ? {className:cls} : {}, `<p${cls ? ` class="${cls}"`:''}>${text}</p>`);
const h = (text, level=2, cls='') => block('heading', {level,...(cls?{className:cls}:{})}, `<h${level} class="wp-block-heading${cls ? ' '+cls : ''}">${text}</h${level}>`);
// core/image persists dimensions only when its resize attributes are set. Keep
// the original SVG viewBox ratio and CSS sizing without invalid saved markup.
const img = (name, alt, cls='') => block('image', {sizeSlug:'full',linkDestination:'none',...(cls?{className:cls}:{})}, `<figure class="wp-block-image size-full${cls?' '+cls:''}"><img src="${asset(name)}" alt="${escape(alt)}"/></figure>`);
const button = (text,url,outline=false) => block('button', outline?{className:'is-style-outline'}:{}, `<div class="wp-block-button${outline?' is-style-outline':''}"><a class="wp-block-button__link wp-element-button" href="${url}">${text}</a></div>`);
const actions = (...items) => block('buttons', {className:'lp-actions'}, `<div class="wp-block-buttons lp-actions">${items.join('')}</div>`);
const section = (html,cls='') => group('lp-section '+cls,group('lp-shell',html),'section');
const head = (eyebrow,title,desc='') => group('lp-section-head', group('lp-heading-group',p(eyebrow,'lp-eyebrow')+h(title)) + (desc?p(desc):''));
const detail = (summary,html) => block('details', {}, `<details class="wp-block-details"><summary>${summary}</summary>${html}</details>`);
const list = items => block('list',{className:'lp-price-list'},`<ul class="wp-block-list lp-price-list">${items.map(x=>block('list-item',{},`<li>${x}</li>`)).join('')}</ul>`);
const intro = (en,title,description) => group('lp-page-intro',group('lp-shell',p(en,'lp-eyebrow')+h(title,1)+p(description,'lp-lead')),'section');
const cta = () => group('lp-cta',group('lp-shell lp-cta-row',group('lp-cta-copy',p('YOUR NEXT RALLY STARTS HERE','lp-eyebrow')+h('下一球，<br>一起玩。')+p('加入 LINE，聊聊適合你的第一堂課。'))+actions(button('LINE 預約體驗 ↗',line))),'section');
const courseCard = (number,title,desc,photo) => group('lp-course',p(number,'lp-index')+h(title,3)+p(desc)+(photo?img(photo+'.webp',title+'桌球教學情境'):'')+p(`<a href="${href('/class/')}">探索課程 ↗</a>`,'lp-text-link'));
const coachCard = (coach,full=true) => group('lp-coach-card',img(coach.photo+'.webp',coach.name+'教練')+group('lp-coach-body',p(escape(coach.nickname||'LET’S PLAY'),'lp-eyebrow')+h(escape(coach.name),3)+p(escape((coach.sections.find(s=>/理念|特色/.test(s.title))||coach.sections[0]).items[0]))+(full?detail('教練經歷與教學特色',coach.sections.map(s=>h(escape(s.title),4)+s.items.map(t=>p(escape(t))).join('')).join('')):'')));
const locations = () => group('lp-grid-2',group('lp-location',p('01 / LUZHOU','lp-eyebrow')+h('蘆洲店',3)+p('新北市蘆洲區長樂路106號3樓')+p('<a href="tel:+886988521012">0988-521-012 郭執行長</a><br><a href="tel:+886282861011">02-8286-1011</a>')+actions(button('蘆洲店地圖 ↗','https://www.google.com/maps/search/?api=1&amp;query='+encodeURIComponent('新北市蘆洲區長樂路106號3樓'),true),button('洽詢課程',line)))+group('lp-location',p('02 / LINKOU','lp-eyebrow')+h('林口桌球',3)+p('新北市林口區中山路248號B1-2')+p('地下室特力屋入口；到館前請先聯繫。')+p('<a href="tel:+886988521012">0988-521-012 郭執行長</a><br><a href="tel:+886282861011">02-8286-1011</a>')+actions(button('林口桌球地圖 ↗','https://www.google.com/maps/search/?api=1&amp;query='+encodeURIComponent('新北市林口區中山路248號B1-2'),true),button('洽詢課程',line))));
const patterns = {};
const navItems = [['關於我們','/about/'],['課程資訊','/class/'],['教練團隊','/coaches/'],['據點','/locations/'],['合作招募','/partner/']];
patterns.header = group('lp-header',group('lp-shell lp-header-row',block('image',{sizeSlug:'full',linkDestination:'custom',className:'lp-logo'},`<figure class="wp-block-image size-full lp-logo"><a href="${href('/')}"><img src="${asset('brand-logo.svg')}" alt="Let’s Play 桌球聯盟首頁"/></a></figure>`)+block('navigation',{overlayMenu:'mobile',ariaLabel:'主要導覽',layout:{type:'flex',justifyContent:'right'}},navItems.map(([label,url])=>self('navigation-link',{label,url:href(url),kind:'custom'})).join(''))));
patterns.footer = group('lp-footer',group('lp-shell',group('lp-footer-row',group('lp-footer-brand',img('brand-logo.svg','Let’s Play 桌球聯盟','lp-logo')+p('運動 × 創新。從喜歡開始，一起玩桌球。'))+group('lp-footer-contact',p('<a href="tel:+886988521012">0988-521-012 郭執行長</a><br><a href="tel:+886282861011">02-8286-1011</a><br><a href="mailto:playpp2018@gmail.com">playpp2018@gmail.com</a>')+p('新北市蘆洲區長樂路106號3樓'))+group('lp-footer-social',p(`<a href="${line}">LINE @869usyqy ↗</a>`)+p('<a href="https://www.facebook.com/playpp2018">Facebook ↗</a>')))+group('lp-footer-bottom',p('© Let’s Play 桌球聯盟 · 一起玩，玩出你的可能。'))));
patterns.footer += p(`<a href="${line}" aria-label="透過 LINE 洽詢與預約">LINE<br>預約 ↗</a>`,'lp-floating-line');
const soundArt = () => group('lp-sound-grid', ['dong','kii','pa','ka','ko','siou'].map(n=>img('brand-'+n+'.svg','','lp-sound-tile')).join(''));
patterns.home = group('lp-manual-hero',group('lp-shell lp-manual-hero-grid',group('lp-manual-hero-copy',p('JOOOOO! WITH US. / SINCE 2018','lp-eyebrow')+h('Jo起來，<br>玩一下！',1)+p('從第一拍開始，找到一起玩的快樂。','lp-manual-lead')+p('孩子、大人、朋友與家人，<br>在來回之間，讓桌球走進生活。')+actions(button('LINE 預約體驗 ↗',line),button('找到上場地點',href('/locations/'),true)))+soundArt()),'section')
  +group('lp-ticker',p('跨產業合作')+p('全齡複合空間')+p('運動設計美學'))
  +section(head('FIND YOUR GAME','每個起點，都有適合的課。','從小班一起進步，到專屬節奏的個人訓練，找到你的上場方式。')+group('lp-grid-3',courseCard('01 / GROUP','小班一起玩','兒童與成人團體課，在互動練習中培養球感與運動習慣。','children')+courseCard('02 / PERSONAL','專注你的進步','一對一教學，依照程度、目標與節奏安排訓練。','individual')+courseCard('03 / TRAINING','練出下一個自己','菁英訓練、假期營隊與場地租借，延伸你的桌球日常。','camp')))
  +section(group('lp-story-grid',group('lp-story-brand',p('MORE THAN A GAME','lp-eyebrow')+p('LET’S<br>PLAY!','lp-story-word'))+group('lp-story-copy',h('不只學會打球，<br>也喜歡上每一次練習。')+p('Let’s Play 創立於 2018 年。我們相信，從「好玩」開始，孩子可以培養信心與專注力，大人可以釋放壓力，每個人都能找到屬於自己的運動節奏。')+p('透過簡單的口訣、互動的遊戲與循序漸進的引導，讓每一次回球，都多一點成就感。')+actions(button('認識 Let’s Play ↗',href('/about/'),true)))),'lp-story')
  +section(head('MEET YOUR COACH','有人陪你，把每一拍打好。','認識教練的教學特色，找到適合自己的學習方式。')+group('lp-grid-3',coaches.slice(0,3).map(c=>coachCard(c,false)).join(''))+actions(button('認識完整教練團隊 ↗',href('/coaches/'),true)))
  +section(head('PLAY, LEARN & GROW','在玩樂中，看見進步。')+group('lp-grid-2',group('lp-course',p('01 / LET’S PLAY TEST','lp-index')+h('學習進度與檢定洽詢',3)+p('想了解目前的程度，或為下一個目標做準備？透過 LINE 詢問學習安排、現行檢定項目與參加條件。')+actions(button('了解課程與學習安排 ↗',href('/class/'),true)))+group('lp-course',p('02 / LET’S PLAY MATCH','lp-index')+h('桌球賽事',3)+p('從邀請賽、積分賽到學員盃，把練習中的技巧帶進比賽，也在交流中增加學習動力。賽事日期與參加方式請透過 LINE 洽詢。'))))
  +section(head('COME PLAY WITH US','離你近一點，離桌球更近。')+locations())+cta();
patterns.about = intro('ABOUT LET’S PLAY','一起玩，玩出更多可能。','我們希望桌球不只是技術的練習，也是歡笑、交流與生活的一部分。')
  +section(group('lp-story-grid',group('lp-story-brand',p('OUR STORY / SINCE 2018','lp-eyebrow')+p('PLAY<br>FOR JOY.','lp-story-word'))+group('lp-story-copy',h('從一份熱愛，<br>到大家一起玩的空間。')+p('Let’s Play 創立於 2018 年。創辦人阿寬教練就讀麗山國中、松山家商，大學時期受到林學宜教授啟發，理解職業球員訓練的辛苦，也想分享快樂「玩」桌球的方式。')+p('從孩子的信心與專注力，到上班族釋放壓力、年長者豐富退休生活，我們希望每個年齡都能享受桌球。'))))
  +section(head('OUR WAY TO PLAY','讓學習，自然而然發生。')+group('lp-grid-3',group('lp-course',p('01','lp-index')+h('先喜歡，再進步',3)+p('用遊戲、口訣與輕鬆的氣氛，引導不同程度的學員認識桌球。'))+group('lp-course',p('02','lp-index')+h('運動，也是交流',3)+p('養成運動習慣，多一種認識朋友與分享生活的方式。'))+group('lp-course',p('03','lp-index')+h('在來回中成長',3)+p('練習專注、合作與運動家精神，留下歡笑與汗水的回憶。'))))+cta();
const offeringCard = (index,title,caption,items,action='洽詢課程 ↗') => group('lp-course',p(index,'lp-index')+h(title,3)+p(caption)+list(items)+actions(button(action,line)));
patterns.class = intro('CLASSES & LEARNING','你的第一拍，從這裡開始。','兒童與成人團體班、個人訓練、包班與進階需求。透過 LINE，和我們聊聊你的程度、目標與可上課時段。')
  +section(head('CHOOSE YOUR PACE','找到適合你的練習節奏。')+group('lp-grid-3',
    offeringCard('01 / GROUP','兒童／成人小班','和程度相近的夥伴，在互動練習中一起進步。',['小班團體教學','暖身、球感、動作練習與趣味競賽','洽詢適合的年齡分班與時段'])
    +offeringCard('02 / PERSONAL','個人教學','依照你的經驗與目標，討論適合的練習安排。',['一對一教學','可洽詢一對二、一對三安排','確認教練、上課時長與費用'])
    +offeringCard('03 / TRAINING','菁英培訓洽詢','想進一步訓練，或為比賽做準備，先聊聊目前程度。',['說明練習與參賽經驗','洽詢現行進階班型與入班條件','確認訓練時段及內容'])
  )+p('各據點的開班、人數、時長、費用及體驗條件，請於報名前透過 LINE 確認。','lp-notice'))
  +section(head('MORE WAYS TO PLAY','把桌球，排進生活裡。')+group('lp-grid-3',
    offeringCard('04 / PRACTICE','場地租借','揪朋友一起來，維持練習手感。',['提供希望到館的據點與時段','確認空桌、球具及發球機需求','洽詢本次租借費用'],'洽詢租桌 ↗')
    +offeringCard('05 / CAMP','寒暑假桌球營','桌球教學、互動遊戲與體適能練習，讓假期多一點活動與交流。',['詢問本期營隊日期','確認適合年齡與可報名名額','了解報名方案與活動安排'],'洽詢營隊 ↗')
    +offeringCard('06 / PRIVATE GROUP','包班洽詢','和固定夥伴一起練習，討論適合你們的上課方式。',['提供人數、年齡與桌球經驗','選擇希望上課的據點與時段','確認教學安排、時長及費用'],'洽詢包班 ↗')
  ))
  +section(head('YOUR FIRST RALLY','一堂課，從暖身到對打。')+group('lp-grid-3',group('lp-course',p('01 / WARM UP','lp-index')+h('暖身與球感',3)+p('從活動身體、熟悉球拍與球開始，準備進入練習。'))+group('lp-course',p('02 / PRACTICE','lp-index')+h('動作與技術',3)+p('透過正反手練習與教練指導，依照程度調整學習內容。'))+group('lp-course',p('03 / PLAY','lp-index')+h('互動與挑戰',3)+p('結合趣味練習與對打，把學到的動作運用在來回中。')))+actions(button('看品牌短片 ↗','https://www.facebook.com/playpp2018/reels_tab',true)))
  +section(head('YOUR LEARNING PLAN','下一個目標，先聊聊。')+group('lp-grid-2',
    group('lp-course',h('課程與進度安排',3)+p('帶著你的年齡、經驗與學習目標來洽詢。報名前，可請團隊說明適合的班型、課程內容與階段安排，找到自己的練習節奏。'))
    +group('lp-course',h('檢定與進階準備',3)+p('想參加桌球檢定或比賽，請先確認目前的項目、參加條件、費用與準備方向，再討論適合的訓練。')+actions(button('洽詢檢定與學習安排 ↗',line,true)))
  ))
  +section(head('BEFORE YOUR FIRST CLASS','第一次來，先了解。')+group('lp-faq',
    detail('完全沒有打過桌球，也可以參加嗎？',p('可以先透過 LINE 說明年齡與經驗，讓我們協助安排合適的體驗或入門課程。'))
    +detail('如何預約課程或租桌？',p('加入 LINE @869usyqy，提供想上課的據點、可安排時段與需求，由我們確認課程或空桌。'))
    +detail('團體課會做哪些練習？',p('包含暖身、球感訓練、正反手練習、動作指導、體適能與趣味競賽，依學員程度調整。'))
    +detail('有親子或特定年齡的課程嗎？',p('若有親子、幼幼、國高中、銀髮或媽媽早鳥時段需求，請提供年齡、人數與可上課時間，讓團隊確認目前是否有合適班型，或可討論的包班安排。'))
    +detail('體驗課需要費用嗎？',p('預約時請確認該據點與班型的體驗費用、適用對象及次數；各期活動方案請以團隊回覆為準。'))
    +detail('需要自備球拍或其他裝備嗎？',p('預約時請說明是否自備球拍，並確認球具借用、穿著與到館準備事項。'))
    +detail('請假、補課或退費如何處理？',p('報名前請透過 LINE 確認所選方案的請假、補課、退費及遲到規則，並一併詢問家長陪同安排。'))
  ))+cta();
patterns.coaches = intro('THE PEOPLE BEHIND YOUR PROGRESS','一起練習，一起進步。','不同的教學特色，同樣對桌球的熱情。認識 Let’s Play 教練團隊。')+section(group('lp-grid-3',coaches.map(c=>coachCard(c)).join('')))+cta();
patterns.locations = intro('OUR LOCATIONS','找到你的上場地點。','查看據點資訊，透過 LINE 確認課程、體驗與租桌時段。')+section(locations()+p('各據點的營業、上課及租桌時段，請於到館前透過 LINE 確認。','lp-notice'))+cta();
patterns.partner = intro('PARTNERSHIP & CAREERS','讓更多人，一起玩桌球。','學校、企業、運動場館與教練夥伴，一起創造更多接觸桌球的機會。')
  +section(head('LET’S BUILD SOMETHING','把桌球，帶進不同的生活。')+group('lp-grid-3',group('lp-course',p('01 / EDUCATION','lp-index')+h('學校與補習班合作',3)+p('學校社團、幼兒園與補習班課程，結合遊戲、球感與基礎技術，討論適合孩子的教案。'))+group('lp-course',p('02 / COMMUNITY','lp-index')+h('企業與運動場館',3)+p('公司社團、福委會活動、運動中心與趣味比賽，提供教練進駐及活動合作洽詢。'))+group('lp-course',p('03 / COACHES','lp-index')+h('教練夥伴招募',3)+p('歡迎喜歡教學、樂於交流的教練，一起討論課程合作與發展機會。'))))
  +section(group('lp-story-grid',group('lp-story-brand',p('SPORT × CREATIVITY','lp-eyebrow')+p('PLAY<br>TOGETHER.','lp-story-word'))+group('lp-story-copy',h('一起把想法，<br>變成新的可能。')+p('從同業聯盟、跨領域課程到桌球活動，我們樂於和不同領域的夥伴交流。')+p('透過 LINE 告訴我們單位名稱、合作構想、預計地點與時間，讓我們一起討論。')+actions(button('LINE 洽談合作 ↗',line)))),'lp-story');
const pages = [
  {slug:'home',pattern:'home',title:'Let’s Play 桌球聯盟',excerpt:'Jo起來，玩一下！蘆洲與林口桌球課程、教練、場地租借與教育機構合作。'},
  {slug:'about',pattern:'about',title:'關於我們',excerpt:'認識 Let’s Play 桌球聯盟的品牌故事與教學理念。'},
  {slug:'class',pattern:'class',title:'課程資訊與洽詢',excerpt:'了解兒童與成人團體班、個人教學、包班、進階需求與上課流程，透過 LINE 確認課程、費用及體驗安排。'},
  {slug:'coaches',pattern:'coaches',title:'教練團隊',excerpt:'認識 Let’s Play 教練的經歷與教學特色，找到適合自己的學習方式。'},
  {slug:'locations',pattern:'locations',title:'據點資訊',excerpt:'Let’s Play 蘆洲店與林口桌球的地址、聯絡電話與課程洽詢。'},
  {slug:'partner',pattern:'partner',title:'合作與招募',excerpt:'學校、企業、運動場館與教練夥伴，和 Let’s Play 一起推廣桌球。'},
];
await mkdir(path.join(theme,'patterns'),{recursive:true});
for (const [slug,html] of Object.entries(patterns)) {
  const title = pages.find(p=>p.pattern===slug)?.title || (slug==='header'?'品牌頁首':'品牌頁尾');
  await writeFile(path.join(theme,'patterns',slug+'.php'),`<?php\n/**\n * Title: ${title}\n * Slug: lets-play/${slug}\n * Categories: lets-play\n * Inserter: ${['header','footer'].includes(slug)?'no':'yes'}\n */\nif ( ! defined( 'ABSPATH' ) ) { exit; }\n?>\n${html}`);
}
await writeFile(path.join(theme,'inc/pages.json'),JSON.stringify(pages,null,2)+'\n');
console.log(JSON.stringify({patterns:Object.keys(patterns).length,pages:pages.length}));
