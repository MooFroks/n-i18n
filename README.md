# n-i18n

> i18n是什么？i18n（其来源是英文单词internationalization的首末字符i和n，18为中间的字符数）是“国际化”的简称。
> 应用场景为中小型活动页面的多语言配置，支持文本配置，图片配置，样式配置的多语言配置

## API文档

#### 单项使用

data-i18n="$t()" 文本模式渲染

data-i18n="$h()" HTML模式渲染

data-i18n="$c()" 动态替换样式

data-i18n="$m()" 动态替换图片

#### 混合使用

data-i18n="$c(); $m()" 动态替换样式和图片

#### 注意事项

样式替换前提，对class命名规范约束。

图片替换前提，对图片路径规范约束。

#### lang示例

```javascript
const lang = {
    en: {
        title: 'Did you know that Itunu Hotonu, the first female admiral in Africa, joined the Nigerian Navy only because she was rejected by the army?',
        text1: 'The birthday-number effect is the unconscious tendency of people to prefer the numbers in the date of their birthday over other numbers.<br/> First reported in 1997 by Japanese psychologists Shinobu Kitayama and Mayumi Karasawa, the birthday-number effect has been shown to hold across age and gender.',
        // msg: Pacific Theater of Operations
        text2: 'USS Essex was an aircraft carrier and the lead ship of the Essex class built for the United States Navy during World War II. Commissioned in December 1942, Essex participated in several campaigns in the {msg}, earning the Presidential Unit Citation and thirteen battle stars.',
        message: {
            hello: 'hello world!'
        }
    },
    zh: {
        title: 'HKT48的两位成员在AKB48家族 猜拳大会2017胜出后，推出了哪一张单曲？',
        text1: '科学哲学是20世纪兴起的一个哲学分支，关注科学的基础、方法和含义，主要研究科学的本性、科学理论的结构、科学解释、科学检验、科学观察与理论的关系、科学理论的选择等。<br/>该学科的中心问题是：什么有资格作为科学，科学理论的可靠性，和科学的终极目的。',
        // msg: 中国
        text2: '哪一门科学研究地球以外的所有现象，历史可追溯至数千年前的希腊、埃及、{msg}等古代文明？',
        message: {
            hello: '你好，世界！'
        }
    },
    jp: {
        title: 'ケレティ・アーグネシュ（1921年1月9日 - ）は、ハンガリーの元女子体操競技選手。ユダヤ人であることからナチスによる迫害を受けたがホロコーストから生き残り、第二次世界大戦後に30歳代で出場した',
        text1: 'レゲエ (reggae) は狭義においては1960年代後半ジャマイカで成立し、1980年代前半まで流行した4分の4拍子の第2・第4拍目をカッティング奏法で刻むギター、各小節の3拍目にアクセントが置かれるドラム、うねるようなベースラインを奏でるベースなどの音楽的特徴を持つポピュラー音楽である。<br/>広義においてはジャマイカで成立したポピュラー音楽全般のことをいう。',
        // msg: 北西の季節風により
        text2: '日本の気候には、太平洋側と日本海側で大きな違いがみられる。日本海側では、{msg}、冬に雪や雨が多く、太平洋側では、南東の季節風により、夏に雨が多い。',
        message: {
            hello: 'こんにちは世界！'
        }
    }
};
```

```html
<p data-i18n="$t('title')"></p>
<p data-i18n="$h('text1')"></p>
<p data-i18n="$t('text2', {msg: '伟大的渺小~'})"></p>
<p data-i18n="$t('message.hello')"></p>

<div class="d0-common" data-i18n="$c('d0')"></div>

<img class="d1-common" src="./images/holder.jpg" alt="先占位后替换加载新图片" data-i18n="$m('d1'); $c('d1')">
```