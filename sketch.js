let scaleFactor = 1.0;
let minScale = 0.3;
let maxScale = 3.0;

// 字体大小缩放因子（用于诗句和游戏字体）
let fontScaleFactor = 1.0;
let minFontScale = 0.5;
let maxFontScale = 2.0;

// 主模式：'visual' = 视觉模式, 'game' = 游戏模式
let mainMode = 'visual';
// 视觉子模式：'move' = 移动模式, 'click' = 点击模式
let visualSubMode = 'move';
// 水墨效果模式：'trail' = 拖尾流动效果, 'blob' = 墨团散开效果
let inkEffectMode = 'trail';

// 游戏相关变量
let gameState = 'menu'; // 'menu', 'playing', 'gameover'
let gameLevel = 1; // 1, 2, 3, 4
let inkProgress = 0; // 墨条进度 0-100
let currentChar = null; // 当前显示的字符
let charTimer = 0; // 字符显示计时器
let charDuration = 60; // 字符存在时间（帧数）
let gameScore = 0; // 游戏得分
let totalClicks = 0; // 总点击次数
let successfulClicks = 0; // 成功点击次数
let gameMode = 'normal'; // 'normal' = 普通模式, 'time60' = 限时60秒, 'time120' = 限时120秒
let gameTimeRemaining = 0; // 剩余时间（帧数，60fps）
let gameMenuStep = 'mode'; // 'mode' = 选择模式, 'level' = 选择难度, 'ranking' = 查看排行榜

// 排行榜查看模式
let rankingViewMode = 'normal'; // 'normal', 'time60', 'time120'

// 游戏排行榜（使用 localStorage 存储）- 按模式分离
let gameHighScores = {
    normal: [],   // 普通模式排行榜
    time60: [],   // 限时60秒排行榜
    time120: []   // 限时120秒排行榜
}; // 格式: {mode: [{score, accuracy, level, date}]}
const MAX_HIGH_SCORES = 10; // 每个模式最多保存10条记录

// 水墨字符列表 - 包含繁简体毛笔书法常用字
const inkCharacters = [
    // 自然元素
    '水', '火', '木', '金', '土', '山', '川', '日', '月', '星', '雲', '云', '風', '风', '雨', '雪', '雷', '電', '电',
    // 植物动物
    '花', '草', '樹', '树', '竹', '林', '森', '鳥', '鸟', '魚', '鱼', '龍', '龙', '鳳', '凤', '虎', '鹿', '馬', '马',
    // 人文精神
    '人', '心', '情', '愛', '爱', '思', '念', '志', '意', '慧', '悟', '覺', '觉', '靈', '灵', '魂',
    // 哲学概念
    '道', '德', '仁', '義', '义', '禮', '礼', '智', '信', '善', '美', '真', '和', '平', '安', '寧', '宁',
    // 艺术修养
    '書', '书', '畫', '画', '琴', '棋', '詩', '诗', '詞', '词', '歌', '舞', '樂', '乐', '曲', '韻', '韵',
    // 天地宇宙
    '天', '地', '宇', '宙', '乾', '坤', '陰', '阴', '陽', '阳', '太', '極', '极', '無', '无', '有', '空',
    // 品质修养
    '文', '武', '勇', '毅', '剛', '刚', '柔', '清', '雅', '靜', '静', '遠', '远', '高', '深', '博', '精',
    // 吉祥寓意
    '福', '祿', '禄', '壽', '寿', '喜', '財', '财', '吉', '祥', '瑞', '春', '夏', '秋', '冬',
    // 动作状态
    '飛', '飞', '舞', '躍', '跃', '游', '流', '動', '动', '靜', '静', '變', '变', '化', '生', '長', '长', '成',
    // 颜色光影
    '紅', '红', '綠', '绿', '藍', '蓝', '青', '紫', '黃', '黄', '白', '黑', '墨', '彩', '光', '影', '明', '暗'
];

// 难度设置（帧数，假设60fps）
const levelDurations = {
    1: 60,   // 1秒 = 60帧
    2: 90,   // 1.5秒 = 90帧
    3: 120,  // 2秒 = 120帧
    4: 150   // 2.5秒 = 150帧
};

// ==================== 水墨拖尾流动效果（原先的效果）====================
class InkFlow {
    constructor(x, y, angle, speed) {
        this.pos = createVector(x, y);
        this.angle = angle;
        // 固定速度，不受鼠标速度影响
        this.speed = random(2, 3.5);
        this.life = 255;
        // 固定衰减速度，保持停留时间一致
        this.decay = 2.5;
        // 与墨团大小一致的基础宽度
        this.baseWidth = random(20, 35);
        this.noiseOffset = random(1000);
        this.history = []; // 位置历史，用于拖尾
        this.maxHistory = 25; // 更长的拖尾
        
        // 细丝头部效果参数
        this.filaments = []; // 细丝数组
        this.numFilaments = floor(random(3, 6)); // 细丝数量
        this.filamentLength = random(15, 30); // 细丝长度
        this.filamentSpread = random(0.3, 0.6); // 细丝扩散角度
        
        // 初始化细丝
        for (let i = 0; i < this.numFilaments; i++) {
            this.filaments.push({
                angle: this.angle + random(-this.filamentSpread, this.filamentSpread),
                length: this.filamentLength * random(0.7, 1.3),
                width: random(0.5, 2),
                life: 255,
                points: []
            });
        }
    }

    update() {
        // 记录历史位置
        this.history.push(this.pos.copy());
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
        
        // 沿方向移动
        this.pos.x += cos(this.angle) * this.speed;
        this.pos.y += sin(this.angle) * this.speed;
        
        // 更新细丝
        for (let fil of this.filaments) {
            // 记录细丝点
            let lastPoint = fil.points.length > 0 ? fil.points[fil.points.length - 1] : this.pos;
            let filX = lastPoint.x + cos(fil.angle) * 2;
            let filY = lastPoint.y + sin(fil.angle) * 2;
            fil.points.push(createVector(filX, filY));
            
            // 限制细丝长度
            if (fil.points.length > fil.length) {
                fil.points.shift();
            }
            
            // 细丝角度轻微摆动
            fil.angle += random(-0.05, 0.05);
        }
        
        this.life -= this.decay;
    }

    draw() {
        if (this.history.length < 2) return;
        
        let currentWidth = this.baseWidth * scaleFactor;
        
        // 绘制拖尾效果 - 使用圆润的墨团连接
        for (let i = 0; i < this.history.length - 1; i++) {
            let progress = i / this.history.length;
            let alpha = this.life * 0.4 * progress;
            // 宽度变化更平缓，保持圆润
            let width = currentWidth * (0.3 + progress * 0.7);
            
            noStroke();
            fill(30, 30, 30, alpha);
            
            let p1 = this.history[i];
            let p2 = this.history[i + 1];
            
            // 计算两点之间的中点和距离
            let midX = (p1.x + p2.x) / 2;
            let midY = (p1.y + p2.y) / 2;
            let segmentLength = dist(p1.x, p1.y, p2.x, p2.y);
            
            // 绘制圆润的墨团连接
            // 使用椭圆来连接，更圆润
            let angle = atan2(p2.y - p1.y, p2.x - p1.x);
            
            push();
            translate(midX, midY);
            rotate(angle);
            
            // 绘制椭圆形的墨段
            ellipse(0, 0, segmentLength + width * 0.8, width);
            
            pop();
            
            // 在节点处绘制圆形墨点，使连接更圆润
            if (i % 2 === 0) {
                fill(30, 30, 30, alpha * 1.2);
                ellipse(p1.x, p1.y, width * 0.9, width * 0.9);
            }
        }
        
        // 绘制细丝头部效果
        this.drawFilaments();
        
        // 绘制头部墨团 - 与墨团效果大小一致
        let headAlpha = this.life * 0.5;
        noStroke();
        fill(30, 30, 30, headAlpha);
        
        // 多层晕染效果
        for (let layer = 0; layer < 3; layer++) {
            let layerAlpha = headAlpha * (1 - layer * 0.3);
            let layerSize = currentWidth * (1 + layer * 0.4);
            fill(30, 30, 30, layerAlpha * 0.3);
            
            beginShape();
            for (let a = 0; a < TWO_PI; a += 0.2) {
                let noiseVal = noise(cos(a) * 0.5 + this.noiseOffset + layer * 100, 
                                    sin(a) * 0.5 + this.noiseOffset + layer * 100);
                let r = layerSize * 0.5 * (0.85 + noiseVal * 0.3);
                vertex(this.pos.x + cos(a) * r, this.pos.y + sin(a) * r);
            }
            endShape(CLOSE);
        }
        
        // 核心浓墨
        fill(20, 20, 20, headAlpha * 0.8);
        beginShape();
        for (let a = 0; a < TWO_PI; a += 0.2) {
            let noiseVal = noise(cos(a) * 0.5 + this.noiseOffset, sin(a) * 0.5 + this.noiseOffset);
            let r = currentWidth * 0.4 * (0.85 + noiseVal * 0.3);
            vertex(this.pos.x + cos(a) * r, this.pos.y + sin(a) * r);
        }
        endShape(CLOSE);
    }
    
    // 绘制细丝流动头部效果
    drawFilaments() {
        let headAlpha = this.life * 0.6;
        
        for (let fil of this.filaments) {
            if (fil.points.length < 2) continue;
            
            // 绘制细丝
            noFill();
            
            for (let i = 0; i < fil.points.length - 1; i++) {
                let progress = i / fil.points.length;
                let alpha = headAlpha * progress * 0.8;
                let weight = fil.width * progress * scaleFactor;
                
                stroke(20, 20, 20, alpha);
                strokeWeight(weight);
                
                let p1 = fil.points[i];
                let p2 = fil.points[i + 1];
                line(p1.x, p1.y, p2.x, p2.y);
            }
            
            // 绘制细丝末端的墨点
            let lastPoint = fil.points[fil.points.length - 1];
            let dotAlpha = headAlpha * 0.4;
            noStroke();
            fill(20, 20, 20, dotAlpha);
            ellipse(lastPoint.x, lastPoint.y, 3 * scaleFactor, 3 * scaleFactor);
            
            // 随机飞白墨点
            if (random() < 0.3 && fil.points.length > 5) {
                let midIdx = floor(fil.points.length / 2);
                let midPoint = fil.points[midIdx];
                fill(40, 40, 40, dotAlpha * 0.5);
                ellipse(midPoint.x + random(-2, 2), midPoint.y + random(-2, 2), 
                       2 * scaleFactor, 2 * scaleFactor);
            }
        }
    }

    isDead() {
        return this.life <= 0;
    }
}

// ==================== 墨团散开效果（当前的效果）====================
class InkBlob {
    constructor(x, y, angle, size = null) {
        this.pos = createVector(x, y);
        this.angle = angle;
        this.life = 255;
        this.decay = random(1.5, 2.5);
        this.baseSize = size || random(15, 30);
        this.noiseOffset = random(1000);
        this.moveSpeed = random(1, 2.5);
    }

    update() {
        this.pos.x += cos(this.angle) * this.moveSpeed;
        this.pos.y += sin(this.angle) * this.moveSpeed;
        this.life -= this.decay;
    }

    draw() {
        let alpha = this.life * 0.4;
        let currentSize = this.baseSize * scaleFactor;
        noStroke();

        fill(30, 30, 30, alpha);
        beginShape();
        for (let a = 0; a < TWO_PI; a += 0.2) {
            let noiseVal = noise(cos(a) * 0.5 + this.noiseOffset, sin(a) * 0.5 + this.noiseOffset, frameCount * 0.01);
            let r = currentSize * (0.85 + noiseVal * 0.3);
            vertex(this.pos.x + cos(a) * r, this.pos.y + sin(a) * r);
        }
        endShape(CLOSE);

        fill(30, 30, 30, alpha * 0.25);
        beginShape();
        for (let a = 0; a < TWO_PI; a += 0.2) {
            let noiseVal = noise(cos(a) * 0.5 + this.noiseOffset + 100, sin(a) * 0.5 + this.noiseOffset + 100, frameCount * 0.01);
            let r = currentSize * 1.5 * (0.85 + noiseVal * 0.3);
            vertex(this.pos.x + cos(a) * r, this.pos.y + sin(a) * r);
        }
        endShape(CLOSE);

        fill(30, 30, 30, alpha * 0.1);
        beginShape();
        for (let a = 0; a < TWO_PI; a += 0.2) {
            let noiseVal = noise(cos(a) * 0.5 + this.noiseOffset + 200, sin(a) * 0.5 + this.noiseOffset + 200, frameCount * 0.01);
            let r = currentSize * 2 * (0.85 + noiseVal * 0.3);
            vertex(this.pos.x + cos(a) * r, this.pos.y + sin(a) * r);
        }
        endShape(CLOSE);
    }

    isDead() {
        return this.life <= 0;
    }
}

class WaveRing {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.radius = 0;
        this.baseMaxRadius = random(60, 120);
        this.life = 255;
        this.decay = 4;
        this.noiseOffset = random(1000);
    }

    update() {
        this.radius += 3;
        this.life -= this.decay;
    }

    draw() {
        let currentMaxRadius = this.baseMaxRadius * scaleFactor;
        if (this.radius > currentMaxRadius) return;

        let alpha = this.life * 0.25;
        noFill();
        stroke(30, 30, 30, alpha);
        strokeWeight(3 * scaleFactor);

        beginShape();
        for (let a = 0; a < TWO_PI; a += 0.15) {
            let noiseVal = noise(cos(a) * 0.5 + this.noiseOffset, sin(a) * 0.5 + this.noiseOffset, frameCount * 0.02);
            let r = this.radius * (0.9 + noiseVal * 0.2);
            vertex(this.pos.x + cos(a) * r, this.pos.y + sin(a) * r);
        }
        endShape(CLOSE);
    }

    isDead() {
        let currentMaxRadius = this.baseMaxRadius * scaleFactor;
        return this.life <= 0 || this.radius > currentMaxRadius;
    }
}

class InkCharacter {
    constructor(char, x, y, duration) {
        this.char = char;
        this.x = x;
        this.y = y;
        this.duration = duration;
        this.life = duration;
        this.size = random(60, 100);
        this.noiseOffset = random(1000);
        this.hitBox = this.size * 0.8;
    }

    update() {
        this.life--;
    }

    draw() {
        let progress = this.life / this.duration;
        let alpha = 255;
        
        // 时间快到时闪烁
        if (progress < 0.3) {
            alpha = 100 + sin(frameCount * 0.5) * 100;
        }

        push();
        translate(this.x, this.y);
        
        let currentSize = this.size * fontScaleFactor;
        
        // 绘制毛笔风格字符 - 多层叠加营造墨韵效果
        textAlign(CENTER, CENTER);
        textSize(currentSize);
        
        // 尝试使用毛笔风格的字体
        // 优先使用系统自带的楷体、隶书等传统字体
        let fonts = ['KaiTi', 'STKaiti', 'BiauKai', 'LiSu', 'STLiti', 'SimSun', 'serif'];
        let fontName = fonts[0];
        
        // 外层淡墨晕染 - 模拟墨水渗透
        for (let i = 3; i >= 1; i--) {
            fill(30, 30, 30, alpha * 0.15 / i);
            noStroke();
            textFont(fontName);
            let offset = i * 3;
            // 随机轻微偏移模拟毛笔笔触的自然感
            let randomOffsetX = sin(frameCount * 0.05 + this.noiseOffset) * offset * 0.5;
            let randomOffsetY = cos(frameCount * 0.05 + this.noiseOffset) * offset * 0.5;
            text(this.char, randomOffsetX, randomOffsetY);
        }
        
        // 中层墨色
        fill(30, 30, 30, alpha * 0.6);
        textFont(fontName);
        text(this.char, 0, 0);
        
        // 内层浓墨核心 - 模拟毛笔着墨最浓处
        fill(15, 15, 15, alpha * 0.9);
        textFont(fontName);
        // 稍微缩小营造笔触粗细变化
        textSize(currentSize * 0.95);
        text(this.char, 0, 0);
        
        // 恢复字体大小
        textSize(currentSize);
        
        // 绘制倒计时圈 - 毛笔风格的不规则圆
        noFill();
        stroke(30, 30, 30, 150);
        strokeWeight(2 * fontScaleFactor);
        
        let angle = map(this.life, 0, this.duration, 0, TWO_PI);
        let radius = currentSize * 0.75;
        
        // 绘制不规则倒计时圈
        beginShape();
        noFill();
        for (let a = -PI/2; a < -PI/2 + angle; a += 0.1) {
            let noiseVal = noise(cos(a) * 0.5 + this.noiseOffset, sin(a) * 0.5 + this.noiseOffset);
            let r = radius * (0.95 + noiseVal * 0.1);
            vertex(cos(a) * r, sin(a) * r);
        }
        endShape();
        
        pop();
    }

    isDead() {
        return this.life <= 0;
    }

    checkClick(mx, my) {
        let d = dist(mx, my, this.x, this.y);
        return d < this.hitBox * fontScaleFactor;
    }
}

let inkBlobs = [];
let inkFlows = []; // 拖尾效果数组
let waveRings = [];
let prevMousePos;

// 卷轴背景相关变量
let scrollLayers = []; // 卷轴层数组
let numScrollLayers = 4; // 卷轴层数
let scrollSpeed = 0.5; // 基础滚动速度

// 纵向流动文字背景相关变量
let flowingTexts = []; // 流动文字数组
let numTextLayers = 5; // 文字层数（用于深度效果）
let poemLines = []; // 诗句数组

// 诗句背景配置
let poemLayoutMode = 'single'; // 'single' = 单列, 'double' = 双列
let poemLifeTimeMode = 'normal'; // 'normal' = 默认, 'extended' = 延长5秒

// 上下波浪墨细线背景
let waveLines = []; // 波浪线数组
let numWaveLines = 8; // 波浪线数量

// 快捷键说明显示状态
let showHelp = false;

// 纯净全屏模式（隐藏所有UI）
let cleanFullscreen = false;

// 古诗词数据库 - 按诗分组，每组包含上下文
const poemGroups = [
    // 静夜思 - 李白
    ["床前明月光", "疑是地上霜", "举头望明月", "低头思故乡"],
    // 春晓 - 孟浩然
    ["春眠不觉晓", "处处闻啼鸟", "夜来风雨声", "花落知多少"],
    // 登鹳雀楼 - 王之涣
    ["白日依山尽", "黄河入海流", "欲穷千里目", "更上一层楼"],
    // 相思 - 王维
    ["红豆生南国", "春来发几枝", "愿君多采撷", "此物最相思"],
    // 鹿柴 - 王维
    ["空山不见人", "但闻人语响", "返景入深林", "复照青苔上"],
    // 江雪 - 柳宗元
    ["千山鸟飞绝", "万径人踪灭", "孤舟蓑笠翁", "独钓寒江雪"],
    // 寻隐者不遇 - 贾岛
    ["松下问童子", "言师采药去", "只在此山中", "云深不知处"],
    // 夜宿山寺 - 李白
    ["危楼高百尺", "手可摘星辰", "不敢高声语", "恐惊天上人"],
    // 悯农 - 李绅
    ["锄禾日当午", "汗滴禾下土", "谁知盘中餐", "粒粒皆辛苦"],
    // 赋得古原草送别 - 白居易
    ["离离原上草", "一岁一枯荣", "野火烧不尽", "春风吹又生"],
    // 春夜喜雨 - 杜甫
    ["好雨知时节", "当春乃发生", "随风潜入夜", "润物细无声"],
    ["野径云俱黑", "江船火独明", "晓看红湿处", "花重锦官城"],
    // 春望 - 杜甫
    ["国破山河在", "城春草木深", "感时花溅泪", "恨别鸟惊心"],
    ["烽火连三月", "家书抵万金", "白头搔更短", "浑欲不胜簪"],
    // 山居秋暝 - 王维
    ["空山新雨后", "天气晚来秋", "明月松间照", "清泉石上流"],
    ["竹喧归浣女", "莲动下渔舟", "随意春芳歇", "王孙自可留"],
    // 望月怀远 - 张九龄
    ["海上生明月", "天涯共此时", "情人怨遥夜", "竟夕起相思"],
    ["灭烛怜光满", "披衣觉露滋", "不堪盈手赠", "还寝梦佳期"],
    // 月下独酌 - 李白
    ["花间一壶酒", "独酌无相亲", "举杯邀明月", "对影成三人"],
    ["月既不解饮", "影徒随我身", "暂伴月将影", "行乐须及春"],
    ["我歌月徘徊", "我舞影零乱", "醒时同交欢", "醉后各分散"],
    // 独坐敬亭山 - 李白
    ["众鸟高飞尽", "孤云独去闲", "相看两不厌", "只有敬亭山"],
    // 早发白帝城 - 李白
    ["朝辞白帝彩云间", "千里江陵一日还", "两岸猿声啼不住", "轻舟已过万重山"],
    // 黄鹤楼送孟浩然之广陵 - 李白
    ["故人西辞黄鹤楼", "烟花三月下扬州", "孤帆远影碧空尽", "唯见长江天际流"],
    // 望庐山瀑布 - 李白
    ["日照香炉生紫烟", "遥看瀑布挂前川", "飞流直下三千尺", "疑是银河落九天"],
    // 绝句 - 杜甫
    ["两个黄鹂鸣翠柳", "一行白鹭上青天", "窗含西岭千秋雪", "门泊东吴万里船"],
    // 江南逢李龟年 - 杜甫
    ["岐王宅里寻常见", "崔九堂前几度闻", "正是江南好风景", "落花时节又逢君"],
    // 闻官军收河南河北 - 杜甫
    ["剑外忽传收蓟北", "初闻涕泪满衣裳", "却看妻子愁何在", "漫卷诗书喜欲狂"],
    ["白日放歌须纵酒", "青春作伴好还乡", "即从巴峡穿巫峡", "便下襄阳向洛阳"],
    // 黄鹤楼 - 崔颢
    ["昔人已乘黄鹤去", "此地空余黄鹤楼", "黄鹤一去不复返", "白云千载空悠悠"],
    ["晴川历历汉阳树", "芳草萋萋鹦鹉洲", "日暮乡关何处是", "烟波江上使人愁"],
    // 水调歌头 - 苏轼
    ["明月几时有", "把酒问青天", "不知天上宫阙", "今夕是何年"],
    ["我欲乘风归去", "又恐琼楼玉宇", "高处不胜寒", "起舞弄清影"],
    ["转朱阁", "低绮户", "照无眠", "不应有恨"],
    ["人有悲欢离合", "月有阴晴圆缺", "此事古难全", "但愿人长久"],
    // 念奴娇·赤壁怀古 - 苏轼
    ["大江东去", "浪淘尽", "千古风流人物", "故垒西边"],
    ["乱石穿空", "惊涛拍岸", "卷起千堆雪", "江山如画"],
    ["遥想公瑾当年", "小乔初嫁了", "雄姿英发", "羽扇纶巾"],
    ["故国神游", "多情应笑我", "早生华发", "人生如梦"],
    // 声声慢 - 李清照
    ["寻寻觅觅", "冷冷清清", "凄凄惨惨戚戚", "乍暖还寒时候"],
    ["三杯两盏淡酒", "怎敌他", "晚来风急", "雁过也"],
    ["满地黄花堆积", "憔悴损", "如今有谁堪摘", "守着窗儿"],
    ["梧桐更兼细雨", "到黄昏", "点点滴滴", "这次第"],
    // 满江红 - 岳飞
    ["怒发冲冠", "凭栏处", "潇潇雨歇", "抬望眼"],
    ["三十功名尘与土", "八千里路云和月", "莫等闲", "白了少年头"],
    ["靖康耻", "犹未雪", "臣子恨", "何时灭"],
    ["驾长车", "踏破贺兰山缺", "待从头", "收拾旧山河"],
    // 诗经·关雎
    ["关关雎鸠", "在河之洲", "窈窕淑女", "君子好逑"],
    ["参差荇菜", "左右流之", "窈窕淑女", "寤寐求之"],
    ["求之不得", "寤寐思服", "悠哉悠哉", "辗转反侧"],
    // 诗经·蒹葭
    ["蒹葭苍苍", "白露为霜", "所谓伊人", "在水一方"],
    ["溯洄从之", "道阻且长", "溯游从之", "宛在水中央"],
    // 天净沙·秋思 - 马致远
    ["枯藤老树昏鸦", "小桥流水人家", "古道西风瘦马", "夕阳西下"],
    // 山坡羊·潼关怀古 - 张养浩
    ["峰峦如聚", "波涛如怒", "山河表里潼关路", "望西都"],
    ["伤心秦汉经行处", "宫阙万间都做了土", "兴百姓苦", "亡百姓苦"],
    // 苏幕遮 - 范仲淹
    ["碧云天", "黄叶地", "秋色连波", "波上寒烟翠"],
    ["山映斜阳天接水", "芳草无情", "更在斜阳外", "黯乡魂"],
    ["夜夜除非", "好梦留人睡", "明月楼高休独倚", "酒入愁肠"]
];

// 兼容旧代码：将所有诗句展平为一维数组
const poemDatabase = poemGroups.flat();

// 流动诗句类 - 纵向排列，逐字显示
class FlowingPoem {
    constructor(layerIndex) {
        this.layerIndex = layerIndex;
        this.reset();
    }
    
    reset() {
        // 根据层级设置属性（近大远小）
        this.depthFactor = map(this.layerIndex, 0, numTextLayers - 1, 1.0, 0.4);
        
        // 根据布局模式选择诗句
        if (poemLayoutMode === 'double') {
            // 双列模式：选择同一首诗的连续两句
            // 先随机选择一首诗组
            let selectedGroup = random(poemGroups);
            // 确保诗组至少有两句
            if (selectedGroup.length >= 2) {
                // 随机选择起始句（确保有下一句）
                let startIndex = floor(random(0, selectedGroup.length - 1));
                this.poem1 = selectedGroup[startIndex];
                this.poem2 = selectedGroup[startIndex + 1];
            } else {
                // 如果诗组只有一句，复制使用
                this.poem1 = selectedGroup[0];
                this.poem2 = selectedGroup[0];
            }
            this.chars1 = this.poem1.split('');
            this.chars2 = this.poem2.split('');
            // 使用较长的诗句决定高度
            this.chars = this.chars1.length > this.chars2.length ? this.chars1 : this.chars2;
        } else {
            // 单列模式：选择一句诗
            this.poem = random(poemDatabase);
            this.chars = this.poem.split('');
        }
        
        // 位置设置
        this.x = random(width * 0.1, width * 0.9);
        this.y = random(-300, -100); // 从屏幕上方外开始
        
        // 字体大小：近处大，远处小
        this.baseSize = random(36, 60) * this.depthFactor;
        this.size = this.baseSize;
        
        // 字间距（纵向）
        this.charSpacing = this.size * 1.3;
        
        // 双列模式下的行间间距（上下排列时的行间距）
        this.lineSpacing = this.size * 2.5;
        
        // 流动速度：近处快，远处慢
        this.speed = random(0.4, 1.0) * this.depthFactor;
        
        // 透明度：近处深，远处浅
        this.alpha = map(this.layerIndex, 0, numTextLayers - 1, 90, 30);
        
        // 颜色：近处深墨，远处淡墨
        let grayValue = map(this.layerIndex, 0, numTextLayers - 1, 20, 90);
        this.baseColor = color(grayValue, grayValue, grayValue);
        
        // 毛笔飞白效果参数
        this.inkDryness = random(0.3, 0.8); // 墨色干燥程度
        this.brushTexture = random(1000); // 纹理噪声偏移
        
        // 生命周期 - 根据模式调整
        this.life = 255;
        let baseLife = random(800, 1500);
        if (poemLifeTimeMode === 'extended') {
            // 延长5秒 = 300帧
            this.maxLife = baseLife + 300;
        } else {
            this.maxLife = baseLife;
        }
        this.age = 0;
        
        // 每个字的独立偏移（模拟手写的不规则感）
        this.charOffsets = [];
        let targetChars = poemLayoutMode === 'double' ? this.chars1 : this.chars;
        for (let i = 0; i < targetChars.length; i++) {
            this.charOffsets.push({
                x: random(-3, 3) * this.depthFactor,
                y: random(-2, 2) * this.depthFactor,
                rotation: random(-0.05, 0.05),
                scale: random(0.9, 1.1)
            });
        }
        
        // 双列模式下的第二行偏移（上下排列）
        if (poemLayoutMode === 'double') {
            this.charOffsets2 = [];
            for (let i = 0; i < this.chars2.length; i++) {
                this.charOffsets2.push({
                    x: random(-3, 3) * this.depthFactor,
                    y: random(-2, 2) * this.depthFactor,
                    rotation: random(-0.05, 0.05),
                    scale: random(0.9, 1.1)
                });
            }
        }
    }
    
    update() {
        // 垂直向下流动
        this.y += this.speed;
        
        // 轻微水平摆动
        this.x += sin(frameCount * 0.005 + this.layerIndex) * 0.2;
        
        // 生命周期
        this.age++;
        
        // 淡入淡出
        if (this.age < 80) {
            this.life = map(this.age, 0, 80, 0, 255);
        } else if (this.age > this.maxLife - 80) {
            this.life = map(this.age, this.maxLife - 80, this.maxLife, 255, 0);
        }
        
        // 重置条件
        let totalHeight = this.chars.length * this.charSpacing;
        if (this.y > height + totalHeight || this.age >= this.maxLife) {
            this.reset();
            this.y = random(-200, -50);
        }
    }
    
    draw() {
        push();
        
        let displayAlpha = (this.alpha * this.life / 255) * 0.7;
        let c = red(this.baseColor);
        
        if (poemLayoutMode === 'double') {
            // 双列模式：上下排列，第一行在上，第二行在下
            let line1Height = this.chars1.length * this.charSpacing;
            this.drawColumn(this.chars1, this.charOffsets, 0, 0, displayAlpha, c);
            this.drawColumn(this.chars2, this.charOffsets2, 0, line1Height + this.lineSpacing, displayAlpha, c);
        } else {
            // 单列模式：绘制一列诗句
            this.drawColumn(this.chars, this.charOffsets, 0, 0, displayAlpha, c);
        }
        
        pop();
    }
    
    // 绘制单列诗句
    // yOffset: 额外的Y轴偏移（用于双列模式的上下排列）
    drawColumn(chars, offsets, xOffset, yOffset, displayAlpha, c) {
        for (let i = 0; i < chars.length; i++) {
            let charY = this.y + i * this.charSpacing + yOffset;
            
            // 如果字符在屏幕外，跳过绘制
            if (charY < -this.size || charY > height + this.size) {
                continue;
            }
            
            let offset = offsets[i] || { x: 0, y: 0, rotation: 0, scale: 1 };
            let charX = this.x + offset.x + xOffset;
            let drawY = charY + offset.y;
            
            push();
            translate(charX, drawY);
            rotate(offset.rotation);
            
            let charSize = this.size * offset.scale * fontScaleFactor;
            
            // 绘制毛笔飞白效果（多层渲染）
            this.drawBrushCharacter(chars[i], charSize, c, displayAlpha);
            
            pop();
        }
    }
    
    // 绘制带毛笔效果的字符
    drawBrushCharacter(char, size, gray, alpha) {
        textAlign(CENTER, CENTER);
        textSize(size);
        
        // 设置毛笔风格字体
        drawingContext.font = `${size}px "STKaiti", "KaiTi", "SimSun", serif`;
        
        // 第一层：淡墨底色（飞白效果）
        let baseAlpha = alpha * 0.4;
        fill(gray + 20, gray + 10, gray, baseAlpha);
        noStroke();
        
        // 随机偏移模拟飞白
        for (let j = 0; j < 3; j++) {
            let fx = random(-2, 2) * this.depthFactor;
            let fy = random(-2, 2) * this.depthFactor;
            text(char, fx, fy);
        }
        
        // 第二层：主笔画（浓墨）
        let mainAlpha = alpha * 0.8;
        fill(gray, gray, gray, mainAlpha);
        text(char, 0, 0);
        
        // 第三层：笔触纹理（模拟毛笔痕迹）
        if (this.layerIndex < 3) { // 近处层添加更多细节
            this.drawBrushStrokes(size, gray, alpha);
        }
        
        // 第四层：干笔效果（边缘飞白）
        if (this.inkDryness > 0.5) {
            this.drawDryBrushEffect(char, size, gray, alpha);
        }
    }
    
    // 绘制毛笔笔触纹理
    drawBrushStrokes(size, gray, alpha) {
        stroke(gray, gray, gray, alpha * 0.3);
        strokeWeight(1 * this.depthFactor);
        
        let numStrokes = 5;
        for (let i = 0; i < numStrokes; i++) {
            let angle = random(TWO_PI);
            let len = random(size * 0.3, size * 0.6);
            let x1 = cos(angle) * size * 0.2;
            let y1 = sin(angle) * size * 0.2;
            let x2 = cos(angle) * len;
            let y2 = sin(angle) * len;
            line(x1, y1, x2, y2);
        }
    }
    
    // 绘制干笔飞白效果
    drawDryBrushEffect(char, size, gray, alpha) {
        // 在文字边缘添加不规则的飞白线条
        stroke(gray + 30, gray + 20, gray + 10, alpha * 0.2);
        strokeWeight(0.5);
        
        let numDryLines = floor(random(3, 6));
        for (let i = 0; i < numDryLines; i++) {
            let startAngle = random(TWO_PI);
            let endAngle = startAngle + random(0.3, 0.8);
            let radius = size * 0.4;
            
            noFill();
            beginShape();
            for (let a = startAngle; a < endAngle; a += 0.1) {
                let r = radius + random(-3, 3);
                let x = cos(a) * r;
                let y = sin(a) * r;
                vertex(x, y);
            }
            endShape();
        }
    }
}

// 波浪墨细线类 - 上下连续流动
class WaveInkLine {
    constructor(yPosition, isTop) {
        this.yPosition = yPosition; // 线条的基准Y位置
        this.isTop = isTop; // 是否在上方
        this.reset();
    }
    
    reset() {
        // 波浪参数
        this.amplitude = random(10, 25); // 波浪幅度
        this.frequency = random(0.005, 0.015); // 波浪频率
        this.phase = random(TWO_PI); // 初始相位
        this.speed = random(0.02, 0.05); // 波浪移动速度
        
        // 线条粗细和透明度
        this.strokeWeight = random(0.5, 2);
        this.baseAlpha = random(30, 80);
        
        // 墨色（灰度）
        this.grayValue = random(40, 100);
        
        // 流动方向（左右）
        this.flowDirection = random() > 0.5 ? 1 : -1;
        this.flowSpeed = random(0.5, 1.5);
        this.offsetX = 0; // 水平偏移
        
        // 生命周期
        this.life = 255;
        this.maxLife = random(600, 1200);
        this.age = 0;
    }
    
    update() {
        // 更新相位产生波浪动画
        this.phase += this.speed;
        
        // 水平流动
        this.offsetX += this.flowSpeed * this.flowDirection;
        
        // 循环偏移
        if (abs(this.offsetX) > width) {
            this.offsetX = 0;
        }
        
        // 生命周期
        this.age++;
        
        // 淡入淡出
        if (this.age < 60) {
            this.life = map(this.age, 0, 60, 0, 255);
        } else if (this.age > this.maxLife - 60) {
            this.life = map(this.age, this.maxLife - 60, this.maxLife, 255, 0);
        }
        
        // 重置
        if (this.age >= this.maxLife) {
            this.reset();
        }
    }
    
    draw() {
        let alpha = (this.baseAlpha * this.life / 255) * 0.6;
        
        push();
        
        // 绘制主波浪线
        stroke(this.grayValue, this.grayValue, this.grayValue, alpha);
        strokeWeight(this.strokeWeight);
        noFill();
        
        beginShape();
        for (let x = -50; x <= width + 50; x += 5) {
            // 计算波浪Y偏移
            let waveY = sin((x + this.offsetX) * this.frequency + this.phase) * this.amplitude;
            // 添加次要波浪（更细的细节）
            waveY += sin((x + this.offsetX) * this.frequency * 2.5 + this.phase * 1.5) * (this.amplitude * 0.3);
            
            let y = this.yPosition + waveY;
            vertex(x, y);
        }
        endShape();
        
        // 绘制淡墨阴影线（增加层次感）
        stroke(this.grayValue + 20, this.grayValue + 20, this.grayValue + 20, alpha * 0.5);
        strokeWeight(this.strokeWeight * 0.5);
        
        beginShape();
        for (let x = -50; x <= width + 50; x += 5) {
            let waveY = sin((x + this.offsetX) * this.frequency + this.phase + 0.5) * this.amplitude * 0.8;
            waveY += sin((x + this.offsetX) * this.frequency * 2 + this.phase) * (this.amplitude * 0.2);
            
            let y = this.yPosition + waveY + (this.isTop ? 8 : -8);
            vertex(x, y);
        }
        endShape();
        
        // 随机绘制墨点（飞白效果）
        if (random() < 0.1) {
            let dotX = random(width);
            let waveY = sin((dotX + this.offsetX) * this.frequency + this.phase) * this.amplitude;
            let dotY = this.yPosition + waveY;
            
            noStroke();
            fill(this.grayValue, this.grayValue, this.grayValue, alpha * 0.8);
            ellipse(dotX, dotY, random(2, 5), random(1, 3));
        }
        
        pop();
    }
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    background(245, 240, 230);
    prevMousePos = createVector(mouseX, mouseY);
    document.addEventListener('contextmenu', event => event.preventDefault());
    
    // 初始化卷轴背景
    initScrollBackground();
    
    // 初始化流动文字背景
    initFlowingTexts();
    
    // 初始化波浪墨细线
    initWaveLines();
    
    // 加载排行榜
    loadHighScores();
}

// 初始化波浪墨细线
function initWaveLines() {
    waveLines = [];
    
    // 上方波浪线（顶部区域）
    for (let i = 0; i < numWaveLines / 2; i++) {
        let y = random(30, height * 0.25);
        waveLines.push(new WaveInkLine(y, true));
    }
    
    // 下方波浪线（底部区域）
    for (let i = 0; i < numWaveLines / 2; i++) {
        let y = random(height * 0.75, height - 30);
        waveLines.push(new WaveInkLine(y, false));
    }
}

// 初始化流动文字背景
function initFlowingTexts() {
    flowingTexts = [];
    
    // 每层创建多个诗句，远处层更多
    for (let layer = 0; layer < numTextLayers; layer++) {
        // 根据层级决定该层诗句数量（远处层更多，创造景深）
        let poemsPerLayer = floor(map(layer, 0, numTextLayers - 1, 2, 6));
        
        for (let i = 0; i < poemsPerLayer; i++) {
            let poem = new FlowingPoem(layer);
            // 初始时分散在屏幕上
            poem.y = random(-200, height + 200);
            flowingTexts.push(poem);
        }
    }
}

// 初始化卷轴背景
function initScrollBackground() {
    scrollLayers = [];
    
    // 计算卷轴宽度 - 接近屏幕宽度，但有重叠
    let baseWidth = width * 0.85; // 基础宽度为屏幕宽度的85%
    let overlap = width * 0.15; // 重叠区域为屏幕宽度的15%
    
    for (let i = 0; i < numScrollLayers; i++) {
        // 每个卷轴的宽度略有不同，增加变化
        let scrollWidth = baseWidth + random(-width * 0.1, width * 0.1);
        // 初始位置错开，形成叠加效果
        let startX = (width - scrollWidth) / 2 + (i - numScrollLayers / 2) * overlap + random(-50, 50);
        
        scrollLayers.push({
            x: startX,
            targetX: startX, // 目标位置，用于平滑过渡
            width: scrollWidth,
            height: random(height * 0.75, height * 0.95), // 卷轴高度接近全屏
            alpha: map(i, 0, numScrollLayers - 1, 15, 45), // 透明度，越远越淡
            speed: (i + 1) * scrollSpeed * 0.15, // 速度，越近越快（但比之前更慢）
            yOffset: map(i, 0, numScrollLayers - 1, height * 0.02, height * 0.08), // 垂直偏移很小
            noiseOffset: random(1000),
            color: random(['ink', 'sepia', 'grey']), // 卷轴颜色类型
            layerIndex: i // 层级索引
        });
    }
}

// 绘制卷轴背景
function drawScrollBackground() {
    // 计算滑动范围 - 卷轴在屏幕范围内左右摆动
    let slideRange = width * 0.08; // 滑动范围为屏幕宽度的8%
    
    for (let i = 0; i < scrollLayers.length; i++) {
        let layer = scrollLayers[i];
        
        push();
        
        // 使用正弦波实现平滑的左右摆动
        let time = frameCount * layer.speed * 0.02;
        let offset = sin(time + layer.layerIndex * 0.5) * slideRange;
        layer.x = layer.targetX + offset;
        
        // 绘制卷轴主体
        let y = height - layer.yOffset - layer.height;
        
        // 根据类型设置颜色
        let r, g, b;
        if (layer.color === 'ink') {
            r = 40; g = 40; b = 40; // 墨色
        } else if (layer.color === 'sepia') {
            r = 80; g = 60; b = 40; //  sepia色
        } else {
            r = 60; g = 60; b = 60; // 灰色
        }
        
        // 绘制卷轴边缘（深色）
        fill(r, g, b, layer.alpha + 20);
        noStroke();
        
        // 左边缘
        rect(layer.x, y, 20, layer.height, 5);
        // 右边缘
        rect(layer.x + layer.width - 20, y, 20, layer.height, 5);
        
        // 绘制卷轴主体（淡墨）
        fill(r, g, b, layer.alpha);
        
        // 使用噪声生成不规则的卷轴纹理
        beginShape();
        vertex(layer.x + 20, y);
        
        // 顶部边缘
        for (let tx = 0; tx <= layer.width - 40; tx += 20) {
            let noiseVal = noise((layer.x + tx) * 0.005, layer.noiseOffset, frameCount * 0.001);
            let edgeY = y + noiseVal * 10;
            vertex(layer.x + 20 + tx, edgeY);
        }
        
        vertex(layer.x + layer.width - 20, y);
        vertex(layer.x + layer.width - 20, y + layer.height);
        
        // 底部边缘
        for (let tx = layer.width - 40; tx >= 0; tx -= 20) {
            let noiseVal = noise((layer.x + tx) * 0.005, layer.noiseOffset + 100, frameCount * 0.001);
            let edgeY = y + layer.height + noiseVal * 10;
            vertex(layer.x + 20 + tx, edgeY);
        }
        
        vertex(layer.x + 20, y + layer.height);
        endShape(CLOSE);
        
        // 绘制卷轴纹理线条（模拟水墨晕染）- 减少线条数量优化性能
        stroke(r, g, b, layer.alpha * 0.4);
        strokeWeight(1);
        for (let lineY = y + 50; lineY < y + layer.height - 50; lineY += 40) {
            let noiseVal = noise(lineY * 0.005, layer.noiseOffset, frameCount * 0.0005);
            let lineX = layer.x + 40 + noiseVal * (layer.width - 80);
            let lineLen = 80 + noiseVal * 100;
            line(lineX, lineY, lineX + lineLen, lineY);
        }
        
        // 绘制交叠效果（与相邻卷轴的重叠区域）
        for (let j = 0; j < scrollLayers.length; j++) {
            if (i !== j) {
                let otherLayer = scrollLayers[j];
                let overlapLeft = max(layer.x, otherLayer.x);
                let overlapRight = min(layer.x + layer.width, otherLayer.x + otherLayer.width);
                let overlapWidth = overlapRight - overlapLeft;
                
                if (overlapWidth > 0 && overlapWidth < layer.width * 0.3) {
                    // 重叠区域加深，创造层次感
                    let overlapAlpha = map(overlapWidth, 0, layer.width * 0.3, layer.alpha * 0.5, 0);
                    fill(r, g, b, overlapAlpha);
                    rect(overlapLeft, y + 20, overlapWidth, layer.height - 40);
                }
            }
        }
        
        pop();
    }
}

function draw() {
    // 绘制背景
    background(245, 240, 230);
    
    // 绘制卷轴背景
    drawScrollBackground();
    
    // 绘制波浪墨细线（在卷轴之上，诗句之下）
    drawWaveLines();
    
    // 绘制流动文字背景（在波浪线之上，前景之下）
    drawFlowingTexts();
    
    // 半透明覆盖层，让前景内容更清晰
    fill(245, 240, 230, 40);
    noStroke();
    rect(0, 0, width, height);

    if (mainMode === 'game') {
        drawGame();
    } else {
        drawVisualMode();
    }

    // 纯净全屏模式下只显示ESC提示
    if (cleanFullscreen) {
        drawESCHint();
    } else {
        drawInfo();
        drawModeButtons();
        
        // 绘制快捷键说明
        if (showHelp) {
            drawHelpPanel();
        }
    }
}

// 绘制ESC提示（纯净模式下）
function drawESCHint() {
    push();
    fill(150, 150, 150, 180);
    noStroke();
    textAlign(RIGHT, BOTTOM);
    textSize(12);
    text('按 ESC 退出纯净模式', width - 20, height - 20);
    pop();
}

// 绘制快捷键说明面板
function drawHelpPanel() {
    push();
    
    // 半透明背景遮罩
    fill(0, 0, 0, 150);
    noStroke();
    rect(0, 0, width, height);
    
    // 面板背景
    let panelWidth = 450;
    let panelHeight = 430;
    let panelX = width / 2 - panelWidth / 2;
    let panelY = height / 2 - panelHeight / 2;
    
    fill(245, 240, 230);
    stroke(30);
    strokeWeight(2);
    rect(panelX, panelY, panelWidth, panelHeight, 10);
    
    // 标题
    fill(30);
    noStroke();
    textAlign(CENTER, TOP);
    textSize(24);
    text('⌨️ 快捷键使用说明', width / 2, panelY + 20);
    
    // 快捷键列表
    textAlign(LEFT, TOP);
    textSize(14);
    let startY = panelY + 60;
    let lineHeight = 28;
    let x1 = panelX + 30;
    let x2 = panelX + 150;
    
    let shortcuts = [
        { key: 'ESC', desc: '退出全屏/切换全屏' },
        { key: 'F', desc: '纯净全屏（隐藏所有UI）' },
        { key: 'C', desc: '清屏（清除所有水墨效果）' },
        { key: 'H', desc: '显示/隐藏快捷键说明' },
        { key: '滚轮', desc: '调整水墨特效大小' },
        { key: 'Alt + 滚轮', desc: '调整字体大小' },
        { key: '右键', desc: '切换视觉子模式（移动/点击）' },
        { key: '左键', desc: '点击产生水墨效果' }
    ];
    
    for (let i = 0; i < shortcuts.length; i++) {
        let y = startY + i * lineHeight;
        fill(80);
        text(shortcuts[i].key, x1, y);
        fill(30);
        text(shortcuts[i].desc, x2, y);
    }
    
    // 关闭提示
    fill(120);
    textAlign(CENTER, BOTTOM);
    text('点击任意位置或按 H 键关闭', width / 2, panelY + panelHeight - 20);
    
    pop();
}

// 绘制波浪墨细线
function drawWaveLines() {
    for (let line of waveLines) {
        line.update();
        line.draw();
    }
}

// 绘制流动文字背景
function drawFlowingTexts() {
    // 按层级排序，先画远处的（层级高的），再画近处的（层级低的）
    // 这样近处的诗句会覆盖远处的诗句
    let sortedPoems = [...flowingTexts].sort((a, b) => b.layerIndex - a.layerIndex);
    
    for (let poem of sortedPoems) {
        poem.update();
        poem.draw();
    }
}

function drawVisualMode() {
    let currentMousePos = createVector(mouseX, mouseY);
    let mouseVel = p5.Vector.sub(currentMousePos, prevMousePos);
    let speed = mouseVel.mag();

    // 移动模式：鼠标移动时产生效果
    if (visualSubMode === 'move' && speed > 1) {
        let baseAngle = mouseVel.heading();
        
        if (inkEffectMode === 'trail') {
            // 拖尾流动效果 - 固定生成数量，不受速度影响
            // 使用距离阈值控制生成频率，而不是速度
            let distance = p5.Vector.dist(currentMousePos, prevMousePos);
            if (distance > 15) { // 每移动15像素生成一个拖尾
                let numFlows = 2; // 固定数量
                for (let i = 0; i < numFlows; i++) {
                    let angleSpread = PI / 4;
                    let angle = baseAngle - angleSpread / 2 + random(angleSpread);
                    // 速度参数不再传递给构造函数，内部使用固定速度
                    inkFlows.push(new InkFlow(currentMousePos.x, currentMousePos.y, angle, 0));
                }
            }
        } else {
            // 墨团散开效果
            let numBlobs = map(speed, 1, 40, 1, 4);
            for (let i = 0; i < numBlobs; i++) {
                let angleSpread = PI / 2;
                let angle = baseAngle - angleSpread / 2 + (angleSpread / numBlobs) * i;
                angle += random(-0.3, 0.3);
                let offset = p5.Vector.fromAngle(angle).mult(random(5, 20) * scaleFactor);
                let pos = p5.Vector.add(currentMousePos, offset);
                inkBlobs.push(new InkBlob(pos.x, pos.y, angle));
            }
        }
    }

    // 更新和绘制波圈
    for (let i = waveRings.length - 1; i >= 0; i--) {
        let ring = waveRings[i];
        ring.update();
        ring.draw();
        if (ring.isDead()) waveRings.splice(i, 1);
    }

    // 更新和绘制拖尾效果
    for (let i = inkFlows.length - 1; i >= 0; i--) {
        let flow = inkFlows[i];
        flow.update();
        flow.draw();
        if (flow.isDead()) inkFlows.splice(i, 1);
    }

    // 更新和绘制墨团
    for (let i = inkBlobs.length - 1; i >= 0; i--) {
        let blob = inkBlobs[i];
        blob.update();
        blob.draw();
        if (blob.isDead()) inkBlobs.splice(i, 1);
    }

    // 限制数量 - 仅对波圈进行限制，墨团和拖尾让它们自然衰减消失
    if (waveRings.length > 10) waveRings.splice(0, waveRings.length - 10);

    prevMousePos = currentMousePos.copy();
}

function drawGame() {
    if (gameState === 'menu') {
        drawGameMenu();
    } else if (gameState === 'playing') {
        drawGamePlaying();
    } else if (gameState === 'gameover') {
        drawGameOver();
    }
}

function drawGameMenu() {
    if (gameMenuStep === 'ranking') {
        // 绘制排行榜界面（排行榜有自己的标题）
        drawRankingView();
        return;
    }
    
    push();
    fill(30);
    textAlign(CENTER, CENTER);
    textSize(48);
    text('水墨点击游戏', width / 2, height / 4);
    
    if (gameMenuStep === 'mode') {
        // 选择游戏模式
        textSize(24);
        fill(80);
        text('点击水墨字体获得墨条进度', width / 2, height / 4 + 60);
        text('在时间结束前点击，进入下一个字', width / 2, height / 4 + 90);
        
        textSize(20);
        fill(100);
        text('选择游戏模式：', width / 2, height / 2 - 20);
        
        // 绘制模式按钮
        let modes = [
            { mode: 'normal', text: '普通模式', y: height / 2 + 40, desc: '无时间限制' },
            { mode: 'time60', text: '限时 60 秒', y: height / 2 + 100, desc: '挑战60秒' },
            { mode: 'time120', text: '限时 120 秒', y: height / 2 + 160, desc: '挑战120秒' }
        ];
        
        for (let btn of modes) {
            let btnWidth = 220;
            let btnHeight = 45;
            let isHovered = mouseX > width / 2 - btnWidth / 2 && mouseX < width / 2 + btnWidth / 2 &&
                            mouseY > btn.y - btnHeight / 2 && mouseY < btn.y + btnHeight / 2;
            
            fill(isHovered ? 60 : 30);
            stroke(30);
            strokeWeight(2);
            rect(width / 2 - btnWidth / 2, btn.y - btnHeight / 2, btnWidth, btnHeight, 5);
            
            fill(245, 240, 230);
            noStroke();
            textSize(20);
            text(btn.text, width / 2, btn.y - 5);
            
            textSize(12);
            fill(200);
            text(btn.desc, width / 2, btn.y + 18);
        }
    } else {
        // 选择难度级别
        textSize(24);
        fill(80);
        text('点击水墨字体获得墨条进度', width / 2, height / 4 + 60);
        text('在时间结束前点击，进入下一个字', width / 2, height / 4 + 90);
        
        // 显示当前选择的模式
        let modeText = gameMode === 'normal' ? '普通模式' : 
                      (gameMode === 'time60' ? '限时 60 秒' : '限时 120 秒');
        textSize(16);
        fill(120);
        text(`当前模式: ${modeText}`, width / 2, height / 4 + 125);
        
        textSize(20);
        fill(100);
        text('选择难度级别：', width / 2, height / 2 - 20);
        
        // 绘制难度按钮
        let levels = [
            { level: 1, text: '一级 - 1秒', y: height / 2 + 40 },
            { level: 2, text: '二级 - 1.5秒', y: height / 2 + 90 },
            { level: 3, text: '三级 - 2秒', y: height / 2 + 140 },
            { level: 4, text: '四级 - 2.5秒', y: height / 2 + 190 }
        ];
        
        for (let btn of levels) {
            let btnWidth = 200;
            let btnHeight = 35;
            let isHovered = mouseX > width / 2 - btnWidth / 2 && mouseX < width / 2 + btnWidth / 2 &&
                            mouseY > btn.y - btnHeight / 2 && mouseY < btn.y + btnHeight / 2;
            
            fill(isHovered ? 60 : 30);
            stroke(30);
            strokeWeight(2);
            rect(width / 2 - btnWidth / 2, btn.y - btnHeight / 2, btnWidth, btnHeight, 5);
            
            fill(245, 240, 230);
            noStroke();
            textSize(18);
            text(btn.text, width / 2, btn.y);
        }
        
        // 查看排行榜按钮
        let rankingBtnWidth = 140;
        let rankingBtnHeight = 35;
        let rankingBtnY = height / 2 + 240;
        let isRankingHovered = mouseX > width / 2 - rankingBtnWidth / 2 && mouseX < width / 2 + rankingBtnWidth / 2 &&
                              mouseY > rankingBtnY - rankingBtnHeight / 2 && mouseY < rankingBtnY + rankingBtnHeight / 2;
        
        fill(isRankingHovered ? 80 : 50);
        stroke(30);
        strokeWeight(1);
        rect(width / 2 - rankingBtnWidth / 2, rankingBtnY - rankingBtnHeight / 2, rankingBtnWidth, rankingBtnHeight, 5);
        
        fill(245, 240, 230);
        noStroke();
        textSize(16);
        text('🏆 排行榜', width / 2, rankingBtnY);
        
        // 返回按钮
        let backBtnWidth = 100;
        let backBtnHeight = 30;
        let backBtnY = height / 2 + 290;
        let isBackHovered = mouseX > width / 2 - backBtnWidth / 2 && mouseX < width / 2 + backBtnWidth / 2 &&
                           mouseY > backBtnY - backBtnHeight / 2 && mouseY < backBtnY + backBtnHeight / 2;
        
        fill(isBackHovered ? 80 : 50);
        stroke(30);
        strokeWeight(1);
        rect(width / 2 - backBtnWidth / 2, backBtnY - backBtnHeight / 2, backBtnWidth, backBtnHeight, 5);
        
        fill(200);
        noStroke();
        textSize(14);
        text('← 返回', width / 2, backBtnY);
    }
    
    pop();
}

function drawGamePlaying() {
    // 限时模式：更新倒计时
    if (gameMode !== 'normal' && gameTimeRemaining > 0) {
        gameTimeRemaining--;
        if (gameTimeRemaining <= 0) {
            gameState = 'gameover';
        }
    }
    
    // 更新和绘制当前字符
    if (currentChar) {
        currentChar.update();
        currentChar.draw();
        
        // 普通模式：字符超时结束游戏，限时模式：时间到结束游戏
        if (gameMode === 'normal' && currentChar.isDead()) {
            gameState = 'gameover';
        }
    } else {
        spawnNewCharacter();
    }
    
    // 更新和绘制波圈
    for (let i = waveRings.length - 1; i >= 0; i--) {
        let ring = waveRings[i];
        ring.update();
        ring.draw();
        if (ring.isDead()) waveRings.splice(i, 1);
    }

    // 更新和绘制墨团
    for (let i = inkBlobs.length - 1; i >= 0; i--) {
        let blob = inkBlobs[i];
        blob.update();
        blob.draw();
        if (blob.isDead()) inkBlobs.splice(i, 1);
    }

    if (inkBlobs.length > 150) inkBlobs.splice(0, inkBlobs.length - 150);
    if (waveRings.length > 10) waveRings.splice(0, waveRings.length - 10);
    
    // 绘制墨条进度
    drawInkProgress();
    
    // 绘制得分和倒计时
    push();
    
    // 限时模式：在顶部中间显示倒计时
    if (gameMode !== 'normal') {
        let seconds = Math.ceil(gameTimeRemaining / 60);
        fill(gameTimeRemaining < 300 ? 200 : 30, 30, 30); // 少于5秒变红色
        textAlign(CENTER, TOP);
        textSize(36);
        text(`${seconds}秒`, width / 2, 20);
        
        // 显示当前模式
        textSize(14);
        fill(100);
        text(gameMode === 'time60' ? '限时 60 秒' : '限时 120 秒', width / 2, 60);
    }
    
    // 左侧显示得分和准确率
    fill(30);
    textAlign(LEFT, TOP);
    textSize(20);
    text(`得分: ${gameScore}`, 20, 20);
    text(`准确率: ${totalClicks > 0 ? (successfulClicks / totalClicks * 100).toFixed(1) : 0}%`, 20, 50);
    pop();
}

function drawGameOver() {
    push();
    fill(30);
    textAlign(CENTER, CENTER);
    textSize(48);
    text('游戏结束', width / 2, height / 5);
    
    // 显示游戏模式
    let modeText = gameMode === 'normal' ? '普通模式' : 
                  (gameMode === 'time60' ? '限时 60 秒' : '限时 120 秒');
    textSize(18);
    fill(100);
    text(`模式: ${modeText}`, width / 2, height / 5 + 50);
    
    textSize(24);
    fill(80);
    text(`最终得分: ${gameScore}`, width / 2, height / 5 + 85);
    text(`准确率: ${totalClicks > 0 ? (successfulClicks / totalClicks * 100).toFixed(1) : 0}%`, width / 2, height / 5 + 115);
    text(`墨条进度: ${inkProgress.toFixed(1)}%`, width / 2, height / 5 + 145);
    
    // 保存分数到排行榜（只保存一次）
    let accuracy = totalClicks > 0 ? (successfulClicks / totalClicks * 100) : 0;
    if (!window.scoreSaved) {
        addHighScore(gameScore, accuracy, gameMode, gameLevel);
        window.scoreSaved = true;
    }
    
    // 显示是否进入排行榜
    if (isHighScore(gameScore) || window.scoreSaved) {
        textSize(16);
        fill(180, 120, 60);
        text('🏆 分数已记录到排行榜', width / 2, height / 5 + 175);
    }
    
    // 绘制排行榜
    drawHighScores();
    
    // 返回菜单按钮
    let btnWidth = 180;
    let btnHeight = 40;
    let btnY = height - 80;
    let isHovered = mouseX > width / 2 - btnWidth / 2 && mouseX < width / 2 + btnWidth / 2 &&
                    mouseY > btnY - btnHeight / 2 && mouseY < btnY + btnHeight / 2;
    
    fill(isHovered ? 60 : 30);
    stroke(30);
    strokeWeight(2);
    rect(width / 2 - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 5);
    
    fill(245, 240, 230);
    noStroke();
    textSize(20);
    text('返回菜单', width / 2, btnY);
    
    pop();
}

// 绘制排行榜（游戏结束界面用）
function drawHighScores() {
    // 获取当前模式的排行榜
    let modeScores = gameHighScores[gameMode] || [];
    if (modeScores.length === 0) return;
    
    let startY = height / 2 - 20;
    let lineHeight = 28;
    
    push();
    textAlign(CENTER, CENTER);
    
    // 标题
    fill(60);
    textSize(18);
    let modeTitle = gameMode === 'normal' ? '普通模式' : 
                   (gameMode === 'time60' ? '限时60秒' : '限时120秒');
    text(`🏆 ${modeTitle}排行榜 TOP 10`, width / 2, startY - 30);
    
    // 表头
    textSize(12);
    fill(120);
    text('排名    分数    准确率    难度    日期', width / 2, startY - 5);
    
    // 绘制每条记录
    for (let i = 0; i < modeScores.length; i++) {
        let record = modeScores[i];
        let y = startY + 20 + i * lineHeight;
        
        // 高亮当前分数
        let isCurrentScore = (record.score === gameScore && 
                             record.level === gameLevel &&
                             window.scoreSaved);
        
        if (isCurrentScore) {
            fill(240, 230, 200);
            noStroke();
            rect(width / 2 - 180, y - 10, 360, lineHeight - 2, 3);
        }
        
        // 排名颜色
        if (i === 0) fill(200, 160, 60); // 金牌
        else if (i === 1) fill(160, 160, 160); // 银牌
        else if (i === 2) fill(180, 120, 80); // 铜牌
        else fill(80);
        
        textSize(14);
        textAlign(RIGHT, CENTER);
        text(`${i + 1}.`, width / 2 - 150, y);
        
        // 分数
        fill(isCurrentScore ? 30 : 60);
        textAlign(RIGHT, CENTER);
        text(record.score, width / 2 - 70, y);
        
        // 准确率
        textAlign(CENTER, CENTER);
        text(`${record.accuracy.toFixed(1)}%`, width / 2 - 5, y);
        
        // 难度
        text(`${record.level}级`, width / 2 + 60, y);
        
        // 日期
        textSize(11);
        fill(120);
        text(record.date, width / 2 + 130, y);
    }
    
    pop();
}

// 绘制排行榜查看界面（菜单中用）
function drawRankingView() {
    push();
    textAlign(CENTER, CENTER);
    
    // 游戏标题（放在最上方）
    fill(30);
    textSize(48);
    text('水墨点击游戏', width / 2, height / 8);
    
    // 排行榜标题
    fill(30);
    textSize(36);
    text('🏆 排行榜 TOP 10', width / 2, height / 8 + 60);
    
    // 模式切换按钮
    let modeButtons = [
        { mode: 'normal', text: '普通模式', x: width / 2 - 180 },
        { mode: 'time60', text: '限时60秒', x: width / 2 },
        { mode: 'time120', text: '限时120秒', x: width / 2 + 180 }
    ];
    
    let btnY = height / 8 + 110;
    let btnWidth = 140;
    let btnHeight = 35;
    
    for (let btn of modeButtons) {
        let isSelected = rankingViewMode === btn.mode;
        let isHovered = mouseX > btn.x - btnWidth / 2 && mouseX < btn.x + btnWidth / 2 &&
                        mouseY > btnY - btnHeight / 2 && mouseY < btnY + btnHeight / 2;
        
        // 选中状态用深色，未选中用浅色
        if (isSelected) {
            fill(30);
            stroke(30);
            strokeWeight(2);
        } else {
            fill(isHovered ? 100 : 200);
            stroke(150);
            strokeWeight(1);
        }
        
        rect(btn.x - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 5);
        
        // 文字颜色
        if (isSelected) {
            fill(245, 240, 230);
        } else {
            fill(60);
        }
        noStroke();
        textSize(14);
        text(btn.text, btn.x, btnY);
    }
    
    // 获取当前模式的排行榜数据
    let currentModeScores = gameHighScores[rankingViewMode] || [];
    
    // 表头
    let startY = height / 8 + 170;
    textSize(13);
    fill(100);
    text('排名        分数        准确率        难度        日期', width / 2, startY);
    
    if (currentModeScores.length === 0) {
        // 没有记录
        fill(120);
        textSize(16);
        text('该模式暂无记录，快来挑战吧！', width / 2, height / 2 + 50);
    } else {
        // 绘制每条记录
        let lineHeight = 32;
        for (let i = 0; i < currentModeScores.length; i++) {
            let record = currentModeScores[i];
            let y = startY + 25 + i * lineHeight;
            
            // 排名颜色
            if (i === 0) {
                fill(218, 165, 32); // 金牌 - 金色
                textSize(17);
            } else if (i === 1) {
                fill(169, 169, 169); // 银牌 - 银色
                textSize(16);
            } else if (i === 2) {
                fill(205, 127, 50); // 铜牌 - 铜色
                textSize(16);
            } else {
                fill(60);
                textSize(14);
            }
            
            textAlign(RIGHT, CENTER);
            text(`${i + 1}.`, width / 2 - 180, y);
            
            // 分数
            fill(30);
            textAlign(RIGHT, CENTER);
            text(record.score, width / 2 - 90, y);
            
            // 准确率
            textAlign(CENTER, CENTER);
            fill(80);
            text(`${record.accuracy.toFixed(1)}%`, width / 2 - 10, y);
            
            // 难度
            text(`${record.level}级`, width / 2 + 70, y);
            
            // 日期
            textSize(11);
            fill(120);
            text(record.date, width / 2 + 160, y);
        }
    }
    
    // 返回按钮
    let backBtnWidth = 120;
    let backBtnHeight = 35;
    let backBtnY = height - 50;
    let isHovered = mouseX > width / 2 - backBtnWidth / 2 && mouseX < width / 2 + backBtnWidth / 2 &&
                    mouseY > backBtnY - backBtnHeight / 2 && mouseY < backBtnY + backBtnHeight / 2;
    
    fill(isHovered ? 60 : 30);
    stroke(30);
    strokeWeight(2);
    rect(width / 2 - backBtnWidth / 2, backBtnY - backBtnHeight / 2, backBtnWidth, backBtnHeight, 5);
    
    fill(245, 240, 230);
    noStroke();
    textSize(16);
    text('← 返回', width / 2, backBtnY);
    
    pop();
}

function drawInkProgress() {
    let barWidth = 300;
    let barHeight = 30;
    let x = width / 2 - barWidth / 2;
    let y = height - 80;
    
    push();
    fill(200);
    noStroke();
    rect(x, y, barWidth, barHeight, 5);
    
    fill(30);
    rect(x, y, barWidth * (inkProgress / 100), barHeight, 5);
    
    fill(30);
    textAlign(CENTER, CENTER);
    textSize(16);
    text(`墨条进度: ${inkProgress.toFixed(1)}%`, width / 2, y + barHeight / 2);
    pop();
}

function spawnNewCharacter() {
    let char = random(inkCharacters);
    let x = random(100, width - 100);
    let y = random(100, height - 150);
    let duration = levelDurations[gameLevel];
    currentChar = new InkCharacter(char, x, y, duration);
}

function drawInfo() {
    push();
    fill(100);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(14);
    
    let x = 20;
    let y = 20;
    let lineHeight = 20;
    
    text(`水墨缩放: ${(scaleFactor * 100).toFixed(0)}%`, x, y);
    y += lineHeight;
    text(`字体缩放: ${(fontScaleFactor * 100).toFixed(0)}%`, x, y);
    y += lineHeight;
    
    let modeText = mainMode === 'visual' ? 
                   (visualSubMode === 'move' ? '视觉-移动' : '视觉-点击') : 
                   '游戏模式';
    text(`模式: ${modeText}`, x, y);
    y += lineHeight;
    
    // 显示当前水墨效果模式
    if (mainMode === 'visual') {
        let effectText = inkEffectMode === 'trail' ? '拖尾效果' : '墨团效果';
        text(`特效: ${effectText}`, x, y);
        y += lineHeight;
    }
    
    // 显示诗句配置
    let poemLayoutText = poemLayoutMode === 'single' ? '单列' : '双列';
    let poemLifeText = poemLifeTimeMode === 'normal' ? '默认' : '延长';
    text(`诗句: ${poemLayoutText} / ${poemLifeText}`, x, y);
    
    pop();
}

// 绘制模式切换按钮
function drawModeButtons() {
    push();
    
    // 主模式切换按钮
    let btnY = 70;
    let btnHeight = 30;
    let visualBtnWidth = 100;
    let gameBtnWidth = 100;
    let spacing = 10;
    let totalWidth = visualBtnWidth + spacing + gameBtnWidth;
    let startX = width - 20 - totalWidth;
    
    // 视觉模式按钮
    let visualIsActive = mainMode === 'visual';
    let visualIsHovered = mouseX > startX && mouseX < startX + visualBtnWidth &&
                          mouseY > btnY && mouseY < btnY + btnHeight;
    
    fill(visualIsActive ? 30 : (visualIsHovered ? 80 : 150));
    stroke(30);
    strokeWeight(2);
    rect(startX, btnY, visualBtnWidth, btnHeight, 5);
    
    fill(visualIsActive ? 245 : 30);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(14);
    text('视觉模式', startX + visualBtnWidth / 2, btnY + btnHeight / 2);
    
    // 游戏模式按钮
    let gameBtnX = startX + visualBtnWidth + spacing;
    let gameIsActive = mainMode === 'game';
    let gameIsHovered = mouseX > gameBtnX && mouseX < gameBtnX + gameBtnWidth &&
                        mouseY > btnY && mouseY < btnY + btnHeight;
    
    fill(gameIsActive ? 30 : (gameIsHovered ? 80 : 150));
    stroke(30);
    strokeWeight(2);
    rect(gameBtnX, btnY, gameBtnWidth, btnHeight, 5);
    
    fill(gameIsActive ? 245 : 30);
    noStroke();
    text('游戏模式', gameBtnX + gameBtnWidth / 2, btnY + btnHeight / 2);
    
    // 视觉子模式切换按钮（仅在视觉模式下显示）
    if (mainMode === 'visual') {
        let subBtnY = 110;
        let subBtnWidth = 80;
        let subTotalWidth = subBtnWidth + spacing + subBtnWidth;
        let subStartX = width - 20 - subTotalWidth;
        
        // 移动模式按钮
        let moveIsActive = visualSubMode === 'move';
        let moveIsHovered = mouseX > subStartX && mouseX < subStartX + subBtnWidth &&
                            mouseY > subBtnY && mouseY < subBtnY + btnHeight;
        
        fill(moveIsActive ? 30 : (moveIsHovered ? 80 : 150));
        stroke(30);
        strokeWeight(2);
        rect(subStartX, subBtnY, subBtnWidth, btnHeight, 5);
        
        fill(moveIsActive ? 245 : 30);
        noStroke();
        text('移动', subStartX + subBtnWidth / 2, subBtnY + btnHeight / 2);
        
        // 点击模式按钮
        let clickBtnX = subStartX + subBtnWidth + spacing;
        let clickIsActive = visualSubMode === 'click';
        let clickIsHovered = mouseX > clickBtnX && mouseX < clickBtnX + subBtnWidth &&
                             mouseY > subBtnY && mouseY < subBtnY + btnHeight;
        
        fill(clickIsActive ? 30 : (clickIsHovered ? 80 : 150));
        stroke(30);
        strokeWeight(2);
        rect(clickBtnX, subBtnY, subBtnWidth, btnHeight, 5);
        
        fill(clickIsActive ? 245 : 30);
        noStroke();
        text('点击', clickBtnX + subBtnWidth / 2, subBtnY + btnHeight / 2);
        
        // 效果模式切换按钮（第三行）
        let effectBtnY = 150;
        let effectBtnWidth = 80;
        let effectTotalWidth = effectBtnWidth + spacing + effectBtnWidth;
        let effectStartX = width - 20 - effectTotalWidth;
        
        // 拖尾效果按钮
        let trailIsActive = inkEffectMode === 'trail';
        let trailIsHovered = mouseX > effectStartX && mouseX < effectStartX + effectBtnWidth &&
                             mouseY > effectBtnY && mouseY < effectBtnY + btnHeight;
        
        fill(trailIsActive ? 30 : (trailIsHovered ? 80 : 150));
        stroke(30);
        strokeWeight(2);
        rect(effectStartX, effectBtnY, effectBtnWidth, btnHeight, 5);
        
        fill(trailIsActive ? 245 : 30);
        noStroke();
        text('拖尾', effectStartX + effectBtnWidth / 2, effectBtnY + btnHeight / 2);
        
        // 墨团效果按钮
        let blobBtnX = effectStartX + effectBtnWidth + spacing;
        let blobIsActive = inkEffectMode === 'blob';
        let blobIsHovered = mouseX > blobBtnX && mouseX < blobBtnX + effectBtnWidth &&
                            mouseY > effectBtnY && mouseY < effectBtnY + btnHeight;
        
        fill(blobIsActive ? 30 : (blobIsHovered ? 80 : 150));
        stroke(30);
        strokeWeight(2);
        rect(blobBtnX, effectBtnY, effectBtnWidth, btnHeight, 5);
        
        fill(blobIsActive ? 245 : 30);
        noStroke();
        text('墨团', blobBtnX + effectBtnWidth / 2, effectBtnY + btnHeight / 2);
        
        // 诗句配置按钮（第四行）
        let poemBtnY = 190;
        let poemBtnWidth = 80;
        let poemTotalWidth = poemBtnWidth + spacing + poemBtnWidth;
        let poemStartX = width - 20 - poemTotalWidth;
        
        // 单列/双列切换按钮
        let layoutText = poemLayoutMode === 'single' ? '单列' : '双列';
        let layoutIsHovered = mouseX > poemStartX && mouseX < poemStartX + poemBtnWidth &&
                              mouseY > poemBtnY && mouseY < poemBtnY + btnHeight;
        
        fill(layoutIsHovered ? 80 : 150);
        stroke(30);
        strokeWeight(2);
        rect(poemStartX, poemBtnY, poemBtnWidth, btnHeight, 5);
        
        fill(30);
        noStroke();
        text(layoutText, poemStartX + poemBtnWidth / 2, poemBtnY + btnHeight / 2);
        
        // 生命周期切换按钮
        let lifeText = poemLifeTimeMode === 'normal' ? '默认' : '延长';
        let lifeBtnX = poemStartX + poemBtnWidth + spacing;
        let lifeIsHovered = mouseX > lifeBtnX && mouseX < lifeBtnX + poemBtnWidth &&
                            mouseY > poemBtnY && mouseY < poemBtnY + btnHeight;
        
        fill(lifeIsHovered ? 80 : 150);
        stroke(30);
        strokeWeight(2);
        rect(lifeBtnX, poemBtnY, poemBtnWidth, btnHeight, 5);
        
        fill(30);
        noStroke();
        text(lifeText, lifeBtnX + poemBtnWidth / 2, poemBtnY + btnHeight / 2);
        
        // 清屏按钮（第五行）
        let clearBtnY = 230;
        let clearBtnWidth = 170;
        let clearStartX = width - 20 - clearBtnWidth;
        
        let clearIsHovered = mouseX > clearStartX && mouseX < clearStartX + clearBtnWidth &&
                             mouseY > clearBtnY && mouseY < clearBtnY + btnHeight;
        
        fill(clearIsHovered ? 80 : 150);
        stroke(30);
        strokeWeight(2);
        rect(clearStartX, clearBtnY, clearBtnWidth, btnHeight, 5);
        
        fill(30);
        noStroke();
        text('清屏 (C)', clearStartX + clearBtnWidth / 2, clearBtnY + btnHeight / 2);
        
        // 快捷键说明按钮（第六行）
        let helpBtnY = 270;
        let helpBtnWidth = 170;
        let helpStartX = width - 20 - helpBtnWidth;
        
        let helpIsHovered = mouseX > helpStartX && mouseX < helpStartX + helpBtnWidth &&
                            mouseY > helpBtnY && mouseY < helpBtnY + btnHeight;
        
        fill(helpIsHovered ? 80 : 150);
        stroke(30);
        strokeWeight(2);
        rect(helpStartX, helpBtnY, helpBtnWidth, btnHeight, 5);
        
        fill(30);
        noStroke();
        text('快捷键说明 (H)', helpStartX + helpBtnWidth / 2, helpBtnY + btnHeight / 2);
        
        // 纯净全屏按钮（第七行）
        let cleanBtnY = 310;
        let cleanBtnWidth = 170;
        let cleanStartX = width - 20 - cleanBtnWidth;
        
        let cleanIsHovered = mouseX > cleanStartX && mouseX < cleanStartX + cleanBtnWidth &&
                             mouseY > cleanBtnY && mouseY < cleanBtnY + btnHeight;
        
        fill(cleanIsHovered ? 80 : 150);
        stroke(30);
        strokeWeight(2);
        rect(cleanStartX, cleanBtnY, cleanBtnWidth, btnHeight, 5);
        
        fill(30);
        noStroke();
        text('纯净全屏 (F)', cleanStartX + cleanBtnWidth / 2, cleanBtnY + btnHeight / 2);
    }
    
    // 右下角ESC退出提示（仅在非纯净模式下显示）
    if (!cleanFullscreen) {
        push();
        fill(150);
        noStroke();
        textAlign(RIGHT, BOTTOM);
        textSize(12);
        text('按 ESC 退出全屏', width - 20, height - 20);
        pop();
    }
    
    pop();
}

function mousePressed() {
    // 如果帮助面板显示，点击任意位置关闭
    if (showHelp) {
        showHelp = false;
        return;
    }
    
    // 检查是否点击了模式按钮
    if (checkModeButtonsClick()) {
        return;
    }
    
    if (mainMode === 'game') {
        handleGameClick();
    } else if (mainMode === 'visual' && mouseButton === LEFT && visualSubMode === 'click') {
        createClickEffect(mouseX, mouseY);
    }
}

function keyPressed() {
    // ESC键处理
    if (keyCode === ESCAPE) {
        // 如果处于纯净全屏模式，先退出纯净模式
        if (cleanFullscreen) {
            cleanFullscreen = false;
            fullscreen(false);
            return false;
        }
        // 否则切换普通全屏状态
        let fs = fullscreen();
        fullscreen(!fs);
        return false;
    }
    
    // F键切换纯净全屏模式
    if (key === 'f' || key === 'F') {
        cleanFullscreen = !cleanFullscreen;
        // 进入纯净模式时同时进入全屏，退出时退出全屏
        fullscreen(cleanFullscreen);
        return false;
    }
    
    // 纯净模式下禁用其他快捷键（除了ESC和F）
    if (cleanFullscreen) {
        return false;
    }
    
    // C键清屏
    if (key === 'c' || key === 'C') {
        clearScreen();
        return false;
    }
    
    // H键显示/隐藏快捷键说明
    if (key === 'h' || key === 'H') {
        showHelp = !showHelp;
        return false;
    }
    
    return true;
}

function checkModeButtonsClick() {
    let btnY = 70;
    let btnHeight = 30;
    let visualBtnWidth = 100;
    let gameBtnWidth = 100;
    let spacing = 10;
    let totalWidth = visualBtnWidth + spacing + gameBtnWidth;
    let startX = width - 20 - totalWidth;
    
    // 检查视觉模式按钮
    if (mouseX > startX && mouseX < startX + visualBtnWidth &&
        mouseY > btnY && mouseY < btnY + btnHeight) {
        mainMode = 'visual';
        // 切换到视觉模式时，重置游戏状态，防止点击穿透
        resetGameState();
        return true;
    }
    
    // 检查游戏模式按钮
    let gameBtnX = startX + visualBtnWidth + spacing;
    if (mouseX > gameBtnX && mouseX < gameBtnX + gameBtnWidth &&
        mouseY > btnY && mouseY < btnY + btnHeight) {
        mainMode = 'game';
        gameState = 'menu';
        gameMenuStep = 'mode';
        // 切换到游戏模式时，清空视觉模式的水墨效果
        inkBlobs = [];
        inkFlows = [];
        waveRings = [];
        return true;
    }
    
    // 检查视觉子模式按钮
    if (mainMode === 'visual') {
        let subBtnY = 110;
        let subBtnWidth = 80;
        let subTotalWidth = subBtnWidth + spacing + subBtnWidth;
        let subStartX = width - 20 - subTotalWidth;
        
        // 移动模式按钮
        if (mouseX > subStartX && mouseX < subStartX + subBtnWidth &&
            mouseY > subBtnY && mouseY < subBtnY + btnHeight) {
            visualSubMode = 'move';
            return true;
        }
        
        // 点击模式按钮
        let clickBtnX = subStartX + subBtnWidth + spacing;
        if (mouseX > clickBtnX && mouseX < clickBtnX + subBtnWidth &&
            mouseY > subBtnY && mouseY < subBtnY + btnHeight) {
            visualSubMode = 'click';
            return true;
        }
        
        // 效果模式按钮
        let effectBtnY = 150;
        let effectBtnWidth = 80;
        let effectTotalWidth = effectBtnWidth + spacing + effectBtnWidth;
        let effectStartX = width - 20 - effectTotalWidth;
        
        // 拖尾效果按钮
        if (mouseX > effectStartX && mouseX < effectStartX + effectBtnWidth &&
            mouseY > effectBtnY && mouseY < effectBtnY + btnHeight) {
            inkEffectMode = 'trail';
            return true;
        }
        
        // 墨团效果按钮
        let blobBtnX = effectStartX + effectBtnWidth + spacing;
        if (mouseX > blobBtnX && mouseX < blobBtnX + effectBtnWidth &&
            mouseY > effectBtnY && mouseY < effectBtnY + btnHeight) {
            inkEffectMode = 'blob';
            return true;
        }
        
        // 诗句配置按钮
        let poemBtnY = 190;
        let poemBtnWidth = 80;
        let poemTotalWidth = poemBtnWidth + spacing + poemBtnWidth;
        let poemStartX = width - 20 - poemTotalWidth;
        
        // 单列/双列切换按钮
        if (mouseX > poemStartX && mouseX < poemStartX + poemBtnWidth &&
            mouseY > poemBtnY && mouseY < poemBtnY + btnHeight) {
            poemLayoutMode = poemLayoutMode === 'single' ? 'double' : 'single';
            // 重新初始化诗句以应用新布局
            initFlowingTexts();
            return true;
        }
        
        // 生命周期切换按钮
        let lifeBtnX = poemStartX + poemBtnWidth + spacing;
        if (mouseX > lifeBtnX && mouseX < lifeBtnX + poemBtnWidth &&
            mouseY > poemBtnY && mouseY < poemBtnY + btnHeight) {
            poemLifeTimeMode = poemLifeTimeMode === 'normal' ? 'extended' : 'normal';
            // 重新初始化诗句以应用新生命周期
            initFlowingTexts();
            return true;
        }
        
        // 清屏按钮
        let clearBtnY = 230;
        let clearBtnWidth = 170;
        let clearStartX = width - 20 - clearBtnWidth;
        if (mouseX > clearStartX && mouseX < clearStartX + clearBtnWidth &&
            mouseY > clearBtnY && mouseY < clearBtnY + btnHeight) {
            clearScreen();
            return true;
        }
        
        // 快捷键说明按钮
        let helpBtnY = 270;
        let helpBtnWidth = 170;
        let helpStartX = width - 20 - helpBtnWidth;
        if (mouseX > helpStartX && mouseX < helpStartX + helpBtnWidth &&
            mouseY > helpBtnY && mouseY < helpBtnY + btnHeight) {
            showHelp = !showHelp;
            return true;
        }
        
        // 纯净全屏按钮
        let cleanBtnY = 310;
        let cleanBtnWidth = 170;
        let cleanStartX = width - 20 - cleanBtnWidth;
        if (mouseX > cleanStartX && mouseX < cleanStartX + cleanBtnWidth &&
            mouseY > cleanBtnY && mouseY < cleanBtnY + btnHeight) {
            cleanFullscreen = true;
            // 同时进入浏览器全屏
            fullscreen(true);
            return true;
        }
    }
    
    return false;
}

// 清屏功能
function clearScreen() {
    inkBlobs = [];
    inkFlows = [];
    waveRings = [];
}

function handleGameClick() {
    if (gameState === 'menu') {
        if (gameMenuStep === 'mode') {
            // 选择游戏模式
            let modes = [
                { mode: 'normal', y: height / 2 + 40 },
                { mode: 'time60', y: height / 2 + 100 },
                { mode: 'time120', y: height / 2 + 160 }
            ];
            
            for (let btn of modes) {
                let btnWidth = 220;
                let btnHeight = 45;
                if (mouseX > width / 2 - btnWidth / 2 && mouseX < width / 2 + btnWidth / 2 &&
                    mouseY > btn.y - btnHeight / 2 && mouseY < btn.y + btnHeight / 2) {
                    gameMode = btn.mode;
                    gameMenuStep = 'level'; // 进入难度选择
                    return;
                }
            }
        } else if (gameMenuStep === 'level') {
            // 选择难度级别
            let levels = [
                { level: 1, y: height / 2 + 40 },
                { level: 2, y: height / 2 + 90 },
                { level: 3, y: height / 2 + 140 },
                { level: 4, y: height / 2 + 190 }
            ];
            
            for (let btn of levels) {
                let btnWidth = 200;
                let btnHeight = 35;
                if (mouseX > width / 2 - btnWidth / 2 && mouseX < width / 2 + btnWidth / 2 &&
                    mouseY > btn.y - btnHeight / 2 && mouseY < btn.y + btnHeight / 2) {
                    startGame(btn.level);
                    return;
                }
            }
            
            // 查看排行榜按钮
            let rankingBtnWidth = 140;
            let rankingBtnHeight = 35;
            let rankingBtnY = height / 2 + 240;
            if (mouseX > width / 2 - rankingBtnWidth / 2 && mouseX < width / 2 + rankingBtnWidth / 2 &&
                mouseY > rankingBtnY - rankingBtnHeight / 2 && mouseY < rankingBtnY + rankingBtnHeight / 2) {
                gameMenuStep = 'ranking'; // 进入排行榜
                return;
            }
            
            // 返回按钮
            let backBtnWidth = 100;
            let backBtnHeight = 30;
            let backBtnY = height / 2 + 290;
            if (mouseX > width / 2 - backBtnWidth / 2 && mouseX < width / 2 + backBtnWidth / 2 &&
                mouseY > backBtnY - backBtnHeight / 2 && mouseY < backBtnY + backBtnHeight / 2) {
                gameMenuStep = 'mode'; // 返回模式选择
                return;
            }
        } else if (gameMenuStep === 'ranking') {
            // 模式切换按钮
            let modeButtons = [
                { mode: 'normal', x: width / 2 - 180 },
                { mode: 'time60', x: width / 2 },
                { mode: 'time120', x: width / 2 + 180 }
            ];
            
            let btnY = height / 6 + 50;
            let btnWidth = 140;
            let btnHeight = 35;
            
            for (let btn of modeButtons) {
                if (mouseX > btn.x - btnWidth / 2 && mouseX < btn.x + btnWidth / 2 &&
                    mouseY > btnY - btnHeight / 2 && mouseY < btnY + btnHeight / 2) {
                    rankingViewMode = btn.mode;
                    return;
                }
            }
            
            // 排行榜界面的返回按钮
            let backBtnWidth = 120;
            let backBtnHeight = 35;
            let backBtnY = height - 50;
            if (mouseX > width / 2 - backBtnWidth / 2 && mouseX < width / 2 + backBtnWidth / 2 &&
                mouseY > backBtnY - backBtnHeight / 2 && mouseY < backBtnY + backBtnHeight / 2) {
                gameMenuStep = 'level'; // 返回难度选择
                return;
            }
        }
    } else if (gameState === 'playing' && currentChar) {
        totalClicks++;
        if (currentChar.checkClick(mouseX, mouseY)) {
            // 点击成功
            successfulClicks++;
            gameScore += 10;
            inkProgress = min(inkProgress + 5, 100);
            
            // 添加水墨特效
            createClickEffect(mouseX, mouseY);
            
            currentChar = null;
        }
    } else if (gameState === 'gameover') {
        // 返回菜单按钮 - 与 drawGameOver 中绘制的按钮位置一致
        let btnWidth = 180;
        let btnHeight = 40;
        let btnY = height - 80;
        if (mouseX > width / 2 - btnWidth / 2 && mouseX < width / 2 + btnWidth / 2 &&
            mouseY > btnY - btnHeight / 2 && mouseY < btnY + btnHeight / 2) {
            gameState = 'menu';
            gameMenuStep = 'mode';
            // 清空游戏特效
            inkBlobs = [];
            inkFlows = [];
            waveRings = [];
        }
    }
}

function startGame(level) {
    gameLevel = level;
    gameState = 'playing';
    gameScore = 0;
    inkProgress = 0;
    totalClicks = 0;
    successfulClicks = 0;
    currentChar = null;
    
    // 重置分数保存标志
    window.scoreSaved = false;
    
    // 初始化倒计时
    if (gameMode === 'time60') {
        gameTimeRemaining = 60 * 60; // 60秒 * 60fps
    } else if (gameMode === 'time120') {
        gameTimeRemaining = 120 * 60; // 120秒 * 60fps
    } else {
        gameTimeRemaining = 0; // 普通模式无倒计时
    }
    
    // 清空之前的特效
    inkBlobs = [];
    inkFlows = [];
    waveRings = [];
}

// 重置游戏状态（切换到视觉模式时调用）
function resetGameState() {
    gameState = 'menu';
    gameMenuStep = 'mode';
    currentChar = null;
    gameScore = 0;
    inkProgress = 0;
    totalClicks = 0;
    successfulClicks = 0;
    gameTimeRemaining = 0;
    // 清空所有游戏特效，防止切换到视觉模式时残留
    inkBlobs = [];
    inkFlows = [];
    waveRings = [];
}

// 加载排行榜
function loadHighScores() {
    try {
        let stored = localStorage.getItem('inkFlowHighScores');
        if (stored) {
            let parsed = JSON.parse(stored);
            // 兼容旧格式（数组）和新格式（对象）
            if (Array.isArray(parsed)) {
                // 旧格式，需要迁移
                gameHighScores = {
                    normal: parsed.filter(r => r.mode === 'normal'),
                    time60: parsed.filter(r => r.mode === 'time60'),
                    time120: parsed.filter(r => r.mode === 'time120')
                };
                saveHighScores(); // 保存为新格式
            } else {
                gameHighScores = parsed;
            }
        }
    } catch (e) {
        console.log('无法加载排行榜');
        gameHighScores = { normal: [], time60: [], time120: [] };
    }
}

// 保存排行榜
function saveHighScores() {
    try {
        localStorage.setItem('inkFlowHighScores', JSON.stringify(gameHighScores));
    } catch (e) {
        console.log('无法保存排行榜');
    }
}

// 添加新分数到排行榜
function addHighScore(score, accuracy, mode, level) {
    let newRecord = {
        score: score,
        accuracy: accuracy,
        level: level,
        date: new Date().toLocaleDateString('zh-CN')
    };
    
    // 添加到对应模式的排行榜
    if (!gameHighScores[mode]) {
        gameHighScores[mode] = [];
    }
    
    gameHighScores[mode].push(newRecord);
    // 按分数降序排序
    gameHighScores[mode].sort((a, b) => b.score - a.score);
    // 只保留前10名
    if (gameHighScores[mode].length > MAX_HIGH_SCORES) {
        gameHighScores[mode] = gameHighScores[mode].slice(0, MAX_HIGH_SCORES);
    }
    
    saveHighScores();
}

// 检查分数是否能进入排行榜
function isHighScore(score) {
    let modeScores = gameHighScores[gameMode] || [];
    if (modeScores.length < MAX_HIGH_SCORES) return true;
    return score > modeScores[modeScores.length - 1].score;
}

function createClickEffect(x, y) {
    waveRings.push(new WaveRing(x, y));
    
    if (inkEffectMode === 'trail') {
        // 拖尾效果 - 放射状拖尾
        let numFlows = 10;
        for (let i = 0; i < numFlows; i++) {
            let angle = (TWO_PI / numFlows) * i + random(-0.3, 0.3);
            let speed = random(3, 6);
            inkFlows.push(new InkFlow(x, y, angle, speed));
        }
    } else {
        // 墨团效果 - 放射状墨团
        let numBlobs = 12;
        for (let i = 0; i < numBlobs; i++) {
            let angle = (TWO_PI / numBlobs) * i + random(-0.2, 0.2);
            let offset = p5.Vector.fromAngle(angle).mult(random(10, 30) * scaleFactor);
            let pos = createVector(x + offset.x, y + offset.y);
            inkBlobs.push(new InkBlob(pos.x, pos.y, angle, random(20, 35)));
        }
    }
}

function mouseWheel(event) {
    // 检查是否按下 Alt 键
    if (event.altKey) {
        // Alt + 滚轮：改变字体大小
        let fontZoomSpeed = 0.1;
        if (event.delta < 0) {
            fontScaleFactor = min(fontScaleFactor + fontZoomSpeed, maxFontScale);
        } else {
            fontScaleFactor = max(fontScaleFactor - fontZoomSpeed, minFontScale);
        }
    } else {
        // 普通滚轮：改变水墨特效大小
        let zoomSpeed = 0.1;
        if (event.delta < 0) {
            scaleFactor = min(scaleFactor + zoomSpeed, maxScale);
        } else {
            scaleFactor = max(scaleFactor - zoomSpeed, minScale);
        }
    }
    return false;
}

function mouseReleased() {
    // 仅在视觉模式下，右键切换子模式
    if (mouseButton === RIGHT && mainMode === 'visual') {
        if (visualSubMode === 'move') {
            visualSubMode = 'click';
        } else {
            visualSubMode = 'move';
        }
        console.log('视觉子模式切换到: ' + visualSubMode);
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    background(245, 240, 230);
    
    // 重新初始化卷轴背景以适应新尺寸
    initScrollBackground();
    
    // 重新分布流动文字
    initFlowingTexts();
}
