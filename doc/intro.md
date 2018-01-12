# n-i18n详细解析

> 从来敲代码就是一件快乐的事情。尤其要配上一副机械键盘和一个好心情。

> i18n（其来源是英文单词internationalization的首末字符i和n，18为中间的字符数）是“国际化”的简称。

#### 前言

第一次接触多语言是写一个活动H5页面的时候，那时候写了一大堆的js代码用来切换页面的多语言。之后发现很难维护。第二次做大型活动的时候，用了Vue做了一个SPA。多语言自然用了官方的vue-i18n，发现十分方便，这两次瞬间前后产生了对比。使我产生了不小的兴趣。假设一个简单的页面需要多语言。当然用不着vue，但是也不想用jquery怎么办？

于是花了三天写了这个工具库[n-i18n](https://github.com/Gotjoy/n-i18n)，以后写多语言页面的工作量就可以减少啦~

#### 分析

简单分析后，发现可以参考vue-i18n的配置。但是由于没有实现模板引擎。可以将配置参数放在DOM节点的[dataset](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset)（`data-i18n`）属性上。遍历读取有该dataset的节点。解析里面配置的参数后，就可以读取该节点应该绑定多语言里的哪个文本，传什么参数和动态数据。

在实际开发中。多语言有时候往往不止切换单纯的文本。有时候可能是切换HTML，甚至切换图片，样式（比如```background-image```）的情况出现。因此渲染模式也被我分为了`$t; $h; $m; $c`四种模式，分别对应文本模式、HTML模式、图片模式、样式模式。

实际的难点或者说有趣的点，其实在于：

- 如何准确寻找到有指定dataset的所有DOM节点？
- 巧妙利用正则解析dataset中的多样配置。
- 多种模式如何准确渲染？
- 怎样实现依赖动态数据？并且更新对应的DOM节点。**（更进一步）**

#### 实现

代码参考：[https://github.com/Gotjoy/n-i18n/blob/master/src/i18n-a.js](https://github.com/Gotjoy/n-i18n/blob/master/src/i18n-a.js)

###### 1. 如何准确寻找到有指定dataset的所有DOM节点？

利用递归一层层的遍历所有子节点，符合要求的就保存在一个map映射里。

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

###### 2. 巧妙利用正则解析dataset中的多样配置

比如说我会存在以下四种配置，那么该如何去解析data-i18n里面的配置文本从而拿到自己感兴趣的信息呢？

```html
<p data-i18n="$t('message.hello', {msg: '伟大的渺小~', msg2: 'Until the day!'})"></p>
```

在这里有两个及其重要的正则。

**baseRe正则**负责匹配如上的`'message.hello'`(\$1)和`{msg: '伟大的渺小~', msg2: 'Until the day!'}`(\$2)

**confRe正则**负责进一步匹配`{msg: '伟大的渺小~', msg2: 'Until the day!'}`文本中key(\$1)和value(\$2)

正则的试验推荐这个网站，多去尝试[https://regexr.com](https://regexr.com)

经过正则的处理，已经拿到了全部感兴趣的信息。接下来就是可以利用这些信息去读取多语言配置里的数据并且更新DOM节点了。

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

当然以a.b.c形式获取对象属性这个不难。一个遍历即可。

配置文本中{msg}的替换利用动态生成正则`new RegExp('{' + keys[i] + '}', 'g');`全局替换即可。

###### 3. 多种模式如何准确渲染

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

#### 更进一步

考虑应用场景如下，某些多语言数据依赖于后端返回，并在应用生命周期内持续更新。为了避免低效的手动操作，这些多语言数据应该动态依赖，实现数据改变的时候动态更新依赖了这些数据的DOM节点就好了。

如何做到这一点。利用`Object.defineProperty`JavaScript的这个API到了数据的，遍历配置的中data，并使用Object.defineProperty观察。重点是在里面的setter。当修改data的某个值时，会出发对应的setter，并发射信号通知DOM节点去更新。

代码参考：[https://github.com/Gotjoy/n-i18n/blob/master/src/i18n-b.js](https://github.com/Gotjoy/n-i18n/blob/master/src/i18n-b.js)

#### 唠叨几句

在撸码的路上，兴趣才是让自己进步最大的驱动力。对我而言，造轮子是一件很快乐自豪的事情。因为当前前端业界实在太多轮子了，所以虽然对于每个开发者而言是一件幸福的事情，但是轮子多了也许就忘了当初怎么走路的了。所以每隔一段时间就需要反省一下自己是否老是依靠别人造的轮子，没有什么进步了。

说了这么多，希望大家可以喜欢这篇文章。当然还有如果[n-i18n](https://github.com/Gotjoy/n-i18n)这个工具对你们有所启发或者帮助，那就更好了~

