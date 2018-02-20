i18n是什么？i18n（其来源是英文单词internationalization的首末字符i和n，18为中间的字符数）是“国际化”的简称。

##前言

第一次接触多语言是用野生javascript写H5应用的时候，那时候写了一大堆的累赘重复的代码用来切换页面的多语言，之后自然发现很难维护啦。至于到第二次开发另一个H5应用的时候，用了vue做了一个SPA。多语言自然用了官方的vue-i18n。

因为两次的开发维护体验产生了对比，使我产生了不小的兴趣：假设一个简单的页面需要多语言。当然用不着vue，但是也不想用jquery怎么办？如果要开发类似的i18n库，我该如何实现？

于是花了三天（应该也是两个月前了）写了这个工具库[n-i18n](https://github.com/Gotjoy/n-i18n)，以后写多语言页面的工作量就可以减少啦~

## 分析

简单分析后，发现可以参考vue-i18n的配置。但是由于没有实现也没有必要实现模板引擎。因此其实可以将配置参数放在DOM节点的[dataset](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset)（`data-i18n`）属性上。遍历读取有该dataset的节点。解析里面配置的参数后，就可以读取该节点应该绑定多语言里的哪个文本，配置什么参数和数据。

在实际开发中。多语言有时候往往不止切换单纯的文本。有时候可能是切换HTML，甚至切换图片，样式（比如```background-image```）的情况出现。因此渲染模式也被我分为了`$t; $h; $m; $c`四种模式，分别对应文本模式、HTML模式、图片模式、样式模式。

实现难点或者说有趣的点在于：

- 如何准确寻找到有指定dataset的所有DOM节点？
- 巧妙利用正则解析dataset中的多样配置。
- 多种模式如何准确渲染和组合渲染？
- 实现依赖动态数据，数据改变便更新对应的DOM节点。

## 基础实现

代码参考：[https://github.com/Gotjoy/n-i18n/blob/master/src/i18n-a.js](https://github.com/Gotjoy/n-i18n/blob/master/src/i18n-a.js)

#### 1. 如何准确寻找到有指定dataset的所有DOM节点？

利用递归一层层遍历节点树，符合要求的节点就保存在一个map里，留待之后对其的操作的索引。这里的name其实是默认的`i18n`这个字符串，当然也可以配置其他字符串，然后就可以在节点中配置属性如`data-i18n=""`。

```javascript
(function _trace(parent) {
  const children = parent.children;
  for (let i = 0, len = children.length; i < len; i++) {
    const child = children[i];
    if (child.dataset[name]) {
      map[`${name}#${++tid}`] = child;
    }
    if (child.children.length > 0) {
      _trace(child);
    }
  }
}(this.$mount));
```

#### 2. 巧妙利用正则解析dataset中的多样配置

首先利用字符串截取操作的api来解析配置虽然也可以，但是会相当啰嗦，翻看许多优秀框架的源码，都是一般倾向于用正则去解析。比如说我会存在以下四种配置，那么该如何去解析data-i18n里面的配置文本从而拿到自己感兴趣的信息呢？

```html
<p data-i18n="$t('message.hello', {msg: '伟大的渺小~', msg2: 'Until the day!'})"></p>
```

在这里有两个及其重要的正则，代码稍后亮相。

**baseRe正则**负责匹配如上的`'message.hello'`(\$1)和`{msg: '伟大的渺小~', msg2: 'Until the day!'}`(\$2)
**confRe正则**负责进一步匹配`{msg: '伟大的渺小~', msg2: 'Until the day!'}`文本中key(\$1)和value(\$2)

正则的试验推荐这个网站，多去尝试[https://regexr.com](https://regexr.com)。当然正则我不会详细介绍了，毕竟也是一个很深厚的学问。

经过正则的处理，已经拿到了全部感兴趣的信息。接下来就是可以利用这些信息去读取多语言配置里`lang`的数据并且更新DOM节点了。

```javascript
const baseRe = /\$[t|h|c|m]\(['"](.*?)['"]\,*\s*(.*)\)/g;
const confRe = /(\w+)\:\s*['"](.+?)['"]/g;
let base = '';
let conf = Object.create(null);

c.replace(baseRe, (match, $1, $2) => {
  base = $1;
  if ($2) {
    $2.replace(confRe, (match, $1, $2) => {
      conf[$1] = $2;
    });
  }
});
```

```javascript
const lang = {
  en: {
    message: {
      hello: 'hello world! {msg2}'
    }
  },
  zh: {
    message: {
      hello: '你好，世界！ {msg}'
    }
  }
};
```

细心的同学可能会发现一个问题了，如何以a.b.c形式获取对象属性这个不难。一个遍历即可，简单实现的话只有value不是原始值就继续往里面走就可以了。

```javascript
function getValueBy (obj, keystr) {
    const keyset = keystr.split('.');
    for (let i = 0, len = keyset.length; i < len; i++) {
        let v = obj[keyset[i]];
        if (v || _.isPrimitive(v)) {
            obj = v;
        }
    }
    return _.isPrimitive(obj) ? obj : '';
}
```
找到数据了后，配置文本`lang`中占位的`{msg}`的替换利用动态生成正则`new RegExp('{' + keys[i] + '}', 'g');`全局替换即可。

#### 3. 图片模式和样式模式

以上讲的是文本模式和HTML模式。两个简单的区别就是`innerText`和`innerHTML`替换的区别。但是图片模式和样式模式怎么实现？

首先容我啰嗦几句，为什么我会创造出这两种模式呢？因为有时候设计稿中的某些图片的特殊文本也是多语言的，艺术字体（什么高光，花式渐变、浮雕等等）不可能用代码实现，这时候每个多语言对应切个图片就好了，然后利用图片模式切换就好了。样式模式也是差不多的应用场景了。

图片模式简单实现方法就是路径的替换（当然前提是一定要对多语言图片命名和存放位置都进行强约束）。样式模式其实就是简单的切换class。

```javascript
// class渲染
function render$c (v, c) {
    const locale = this.$locale;
    const langs = Object.keys(this.$messages);
    for (let i = 0, len = langs.length; i < len; i++) {
        if (langs[i] !== locale) {
            _.removeClass(v, `${langs[i]}-${c.base}`);
        }
    }
    _.addClass(v, `${locale}-${c.base}`)
}

// 图片渲染
function render$m (v, c) {
    const locale = this.$locale;
    const langs = Object.keys(this.$messages).join('|');
    const nameRe = new RegExp('(\/(' + langs + '))?\/[^\/]+(?=\\.[^\/]*$)', 'g');
    const src = v.getAttribute('src');
    const path = src.replace(nameRe, `/${locale}/${c.base}`);
    
    v.setAttribute('src', path);
}
```

#### 4. 多种模式如何准确渲染

多种模式混合使用的时候，如何区分并准确渲染？这个只需要合理断开配置文本，并分别运用在该节点上即可。需要注意的是，断开配置时应当判断分号是否不在文本里，否则容易误伤友军。

```html
<img class="d1-common" src="./images/holder.jpg" alt="先占位后替换加载新图片" data-i18n="$m('d1'); $c('d1')">
```

```javascript
const dataI18n = v.dataset[name].split(/;(?:\s*\$[t|h|c|m])/g);
dataI18n.forEach(c => {
  const _c = this.parse(c.trim());
  if (c.includes('$t')) {
    this.render$t(v, _c);
  }
  if (c.includes('$h')) {
    this.render$h(v, _c);
  }
  if (c.includes('$c')) {
    this.render$c(v, _c);
  }
  if (c.includes('$m')) {
    this.render$m(v, _c);
  }
});
```

## 更进一步

考虑应用场景如下，某些多语言数据依赖于后端返回，并在应用生命周期内持续更新。为了避免低效的手动操作，这些多语言数据应该动态依赖，实现数据改变的时候动态更新依赖了这些数据的DOM节点就好了。

如何做到这一点。利用`Object.defineProperty`这个因vue而让大家熟悉的api，遍历配置的中data并进行观察。重点是在里面的setter。当修改data的某个值时，会触发对应的setter，并发射信号通知DOM节点去更新。

代码参考：[https://github.com/Gotjoy/n-i18n/blob/master/src/i18n-b.js](https://github.com/Gotjoy/n-i18n/blob/master/src/i18n-b.js)

## 唠叨几句

在撸码的路上，兴趣才是让自己进步最大的驱动力。对我而言，造轮子是一件很快乐自豪的事情。因为当前前端业界实在太多轮子了，我也会担心轮子多了也许就忘了当初怎么走路的了。当然最重要的是，自己造轮子是个学习探索的过程，自己当造物者并制定规则随时修改规则，不是很好的事情么？

希望大家可以喜欢这篇文章。当然还有如果[n-i18n](https://github.com/Gotjoy/n-i18n)这个工具对你们有所启发或者帮助，那就更好了~

