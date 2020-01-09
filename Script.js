// ==UserScript==
// @name         NGA优化摸鱼体验
// @namespace    https://www.hldww.com/
// @version      1.6
// @require https://cdn.staticfile.org/jquery/3.4.0/jquery.min.js
// @description  NGA论坛显示优化，功能增强，防止突然蹦出一对??而导致的突然性的社会死亡
// @author       HLD
// @match        *://bbs.nga.cn/*
// @match        *://ngabbs.com/*
// @match        *://nga.178.com/*
// ==/UserScript==

(function() {
    'use strict';

    let setting = {
        hideAvatar: true,
        hideSmile: true,
        hideImage: false,
        hideSign: true,
        hideHeader: false,
        linkTargetBlank: true,
        imgResize: true,
        authorMark: true,
        markAndBan: true,
        banMode: 'SIMPLE'
    }
    let post_author = []
    let ban_list = []
    let mark_list = []

    //同步配置
    if(window.localStorage.getItem('hld__NGA_setting')){
        let local_setting = JSON.parse(window.localStorage.getItem('hld__NGA_setting'))
        for(let k in setting) {
            !local_setting.hasOwnProperty(k) && (local_setting[k] = setting[k])
        }
        for(let k in local_setting) {
            !setting.hasOwnProperty(k) && delete local_setting[k]
        }
        setting = local_setting
    }
    //注册按键
    $('body').keyup(function(event){
        if (/textarea|select|input/i.test(event.target.nodeName)
            || /text|password|number|email|url|range|date|month/i.test(event.target.type)) {
            return;
        }
        //切换显示头像
        if(event.keyCode == 81){
            $('.avatar').toggle()
        }
        //切换显示表情
        if(event.keyCode == 87){
            $('img').each(function(){
                const classs = $(this).attr('class');
                if(classs && classs.indexOf('smile') > -1) $(this).toggle()
            })
            $('.smile_alt_text').toggle()
        }
        //切换显示图片
        if(event.keyCode == 69){
            $('.postcontent img').each(function(){
                const classs = $(this).attr('class');
                if(!classs && $(this).width() > 24) {
                    if($(this).is(":hidden")) {
                        $(this).show()
                        $('.switch-img').hide()
                    }else {
                        $('.switch-img').css('display', 'inline')
                        $(this).hide()
                    }
                }
            })
        }
    })
    //查找楼主
    if(setting.authorMark) {
        const local_post_author = window.localStorage.getItem('hld__NGA_post_author')
        local_post_author && (post_author = local_post_author.split(','))
        const tid = GetQueryString('tid')
        if($('#postauthor0').length > 0 && tid) {
            const author_str = `${tid}:${$('#postauthor0').text()}`
            if(post_author.indexOf(author_str) == -1)
                post_author.unshift(author_str) > 10 && post_author.pop()
            window.localStorage.setItem('hld__NGA_post_author', post_author.join(','))
        }
        for(let pa of post_author) {
            const t = pa.split(':')
            if(t[0] == tid) {
                $('body').append(`<input type="hidden" value="${t[1]}" id="hld__post-author">`)
                break
            }
        }
    }
    //拉黑备注
    if(setting.markAndBan) {
        const local_ban_list = window.localStorage.getItem('hld__NGA_ban_list')
        local_ban_list && (ban_list = local_ban_list.split(','))
        const local_mark_list = window.localStorage.getItem('hld__NGA_mark_list')
        local_mark_list && (mark_list = local_mark_list.split(','))
        //绑定事件
        $('body').on('click', '.hld__extra-icon', function(){
            const type = $(this).data('type')
            const user = $(this).data('user')
            if(type == 'ban') {
                let ban_name = window.prompt(' 是否拉黑此用户？\n请检查用户名称，可能会出现解析异常', user)
                ban_name = $.trim(ban_name)
                if(ban_name) {
                    ban_list.push(ban_name)
                    window.localStorage.setItem('hld__NGA_ban_list', ban_list.join(','))
                    alert('已加进黑名单，重载以屏蔽此用户')
                }
            }
            if(type == 'mark') {
                let remark = window.prompt('请输入要备注的名称，此后以此备注高亮显示代替原ID', '')
                remark = $.trim(remark)
                if(remark.indexOf(':') > -1) {
                    alert('备注不能包含“:”为脚本保留符号')
                }else if(remark) {
                    mark_list.push(`${user}:${remark}`)
                    window.localStorage.setItem('hld__NGA_mark_list', mark_list.join(','))
                }
            }
        })
        //隐藏版头
        setting.hideHeader && $('#toppedtopic').hide()
        //名单管理
        $('body').on('click', '#hld__list_manage', function(){
            $('body').append(`<div id="hld__banlist_panel">
<a href="javascript:void(0)" id="hld__banlist_panel_close" class="hld__setting-close">×</a>
<div>
<div class="hld__list-c"><p>黑名单</p><textarea row="20" id="hld__ban_list_textarea"></textarea><p class="hld__list-desc">一行一条</p></div>
<div class="hld__list-c"><p>备注名单</p><textarea row="20" id="hld__mark_list_textarea"></textarea><p class="hld__list-desc">一行一条，格式为<用户名>:<备注> 如“abc123:菜鸡”</p></div>
</div>
<button class="hld__btn hld__save-btn" id="hld__save_list">保存名单列表</button>
</div>`)
            $('#hld__ban_list_textarea').val(ban_list.join('\n'))
            $('#hld__mark_list_textarea').val(mark_list.join('\n'))
        })
        $('body').on('click', '#hld__banlist_panel_close', function(){
            $('#hld__banlist_panel').remove()
        })
        $('body').on('click', '#hld__save_list', function(){
            ban_list = $('#hld__ban_list_textarea').val().split('\n')
            ban_list = RemoveBlank(ban_list)
            ban_list = Uniq(ban_list)
            mark_list = $('#hld__mark_list_textarea').val().split('\n')
            mark_list = RemoveBlank(mark_list)
            mark_list = Uniq(mark_list)
            window.localStorage.setItem('hld__NGA_ban_list', ban_list.join(','))
            window.localStorage.setItem('hld__NGA_mark_list', mark_list.join(','))
            $('#hld__banlist_panel').remove()
        })
    }
    //动态检测
    setInterval(()=>{
        $('.forumbox.postbox[hld-render!=ok]').length > 0 && runDom()
        if(setting.markAndBan && $('.topicrow .author[hld-render!=ok]').length > 0) runMark()
        $('#hld__setting').length == 0 && $('#startmenu > tbody > tr > td.last').append('<div><div class="item"><a id="hld__setting" href="javascript:eval($(\'hld__setting_panel\').style.display=\'block\')" title="打开NGA优化摸鱼插件设置面板">NGA优化摸鱼插件设置</a></div></div>')
    }, 100)
    //大图
    const resizeImg = (el) => {
        if($('#hld__img_full').length > 0) return
        let url_list = []
        let current_index = el.parent().find('[hld__imglist=ready]').index(el)
        el.parent().find('[hld__imglist=ready]').each(function(){
            url_list.push($(this).data('srcorg') || $(this).data('srclazy') || $(this).attr('src'))
        })
        let $imgBox = $('<div id="hld__img_full" title="点击背景关闭"><div id="loader"></div></div>')
        let $img = $('<img title="鼠标滚轮放大/缩小\n左键拖动移动">')

        const renderImg = (index) => {
            let timer = null
            $('#loader').show()
            $img.attr('src', url_list[index]).height($(window).height() * 0.85).hide()
            timer = setInterval(()=>{
                const w = $img.width()
                if(w > 0) {
                    const t = ($(window).height() -$img.height()) / 2 - $(window).height() * 0.05
                    const l = ($(window).width() - w) / 2
                    $img.css({
                        'top':  t + 'px',
                        'left': l + 'px'
                    }).show()
                    $('#loader').hide()
                    clearInterval(timer)
                }
            }, 1)
        }
        //当前图片
        renderImg(current_index)
        $img.mousedown(function (e) {
            var endx = 0;
            var endy = 0;

            var left = parseInt($img.css("left"))
            var top = parseInt($img.css("top"))

            var downx = e.pageX
            var downy = e.pageY

            e.preventDefault()
            $(document).on("mousemove", function (es) {
                var endx = es.pageX - downx + left
                var endy = es.pageY - downy + top
                $img.css("left", endx + "px").css("top", endy + "px")
                return false
            });
        })

        $img.mouseup(function () {
            //鼠标弹起时给div取消事件
            $(document).unbind("mousemove")
        })

        $imgBox.append($img)
        $imgBox.click(function(e){
            $(e.target).attr('id') == 'hld__img_full' && $(this).remove()
        })
        $imgBox.append(`<div class="hld__if_control">
<div class="change prev-img" title="本楼内上一张"><div></div></div>
<div class="change rotate-right" title="逆时针旋转90°"><div></div></div>
<div class="change rotate-left" title="顺时针旋转90°"><div></div></div>
<div class="change next-img" title="本楼内下一张"><div></div></div>
</div>`)
        $imgBox.on('click', '.change', function(){
            if($(this).hasClass('prev-img') && current_index - 1 >= 0)
                renderImg(--current_index)

            if($(this).hasClass('next-img') && current_index + 1 < url_list.length)
                renderImg(++current_index)

            if($(this).hasClass('rotate-right') || $(this).hasClass('rotate-left')) {
                let deg = ($img.data('rotate-deg') || 0) - ($(this).hasClass('rotate-right') ? 90 : -90)
                if(deg >= 360 || deg <= -360) deg = 0
                $img.css('transform', `rotate(${deg}deg)`)
                $img.data('rotate-deg', deg)
            }else {
                $img.css('transform', '')
                $img.data('rotate-deg', 0)
            }
            window.getSelection ? window.getSelection().removeAllRanges() : document.selection.empty()
            return false;
        })

        $imgBox.on("mousewheel DOMMouseScroll", function (e) {
            const delta = (e.originalEvent.wheelDelta && (e.originalEvent.wheelDelta > 0 ? 1 : -1))||
                  (e.originalEvent.detail && (e.originalEvent.detail > 0 ? -1 : 1));

            const offset_y = $img.height() * 0.2
            const offset_x = $img.width() * 0.2
            if(delta > 0) {
                $img.css({
                    'height': ($img.height() + offset_y) + 'px',
                    'top': ($img.position().top - offset_y / 2) + 'px',
                    'left': ($img.position().left - offset_x / 2) + 'px'
                })
            }
            if(delta < 0) {
                $img.css({
                    'height': ($img.height() - offset_y) + 'px',
                    'top': ($img.position().top + offset_y / 2) + 'px',
                    'left': ($img.position().left + offset_x / 2) + 'px'
                })
            }

            e.stopPropagation()
            return false
        })

        $('body').append($imgBox)

    }
    //新页面打开连接
    setting.linkTargetBlank && $('.topic').attr('target', '_blank')
    const runMark = () => {
        $('.topicrow .author[hld-render!=ok]').each(function(){
            ban_list.indexOf($(this).text()) > -1 && $(this).parents('tbody').remove()
            for(let m of mark_list) {
                const t = m.split(':')
                if(t[0] == $(this).text()) {
                    $(this).html(`<b>${t[1]}(${$(this).text()})</b>`)
                }
            }
            //添加标志位
            $(this).attr('hld-render', 'ok')
        })
    }
    const runDom = () => {
        //楼内
        $('.forumbox.postbox[hld-render!=ok]').each(function(){
            //隐藏头像
            let $dom = $(this)
            setting.hideAvatar && $(this).find('.avatar').css('display', 'none')
            //隐藏表情
            $(this).find('img').each(function(){
                const classs = $(this).attr('class');
                if(classs && classs.indexOf('smile') > -1) {
                    const alt = $(this).attr('alt')
                    const $alt = $('<span class="smile_alt_text">[' + alt + ']</span>')
                    setting.hideSmile ? $(this).hide() : $alt.hide()
                    $(this).after($alt)
                }else if(!classs && $(this).attr('onload')) {
                    $(this).attr('hld__imglist', 'ready')
                    if(setting.imgResize) {
                        $(this).width() > 200 && $(this).css({'outline': '', 'outline-offset': '', 'cursor': 'pointer', 'min-width': '200px', 'min-height': 'auto', 'width': '200px', 'height': 'auto', 'margin:': '5px'})
                    }
                    let $imgB = $('<button class="switch-img" style="display:none">图</button>')
                    $imgB.on('click', function(){
                        $(this).prev('img').toggle()
                        $(this).text($(this).prev('img').is(':hidden') ? '图' : '隐藏')
                    })
                    $(this).removeAttr('onload')
                    if(setting.hideImage) {
                        $(this).hide();
                        $imgB.show()
                    }
                    $(this).after($imgB)
                }
            })
            //隐藏签名
            setting.hideSign && $(this).find('.sign, .sigline').css('display', 'none')
            //添加拉黑标记菜单及功能
            if(setting.markAndBan) {
                $(this).find('.small_colored_text_btn.block_txt_c2.stxt').each(function(){
                    let current_user = ''
                    if($(this).parents('td').prev('td').html() == '') {
                        current_user = $(this).parents('table').prev('.posterinfo').children('.author').text()
                    }else {
                        current_user = $(this).parents('td').prev('td').find('.author').text()
                    }
                    $(this).append(`<a class="hld__extra-icon" data-type="mark" title="备注此用户" data-user="${current_user}"><svg t="1578453291663" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="15334" width="32" height="32"><path d="M978.488889 494.933333l-335.644445 477.866667-415.288888 45.511111c-45.511111 5.688889-91.022222-28.444444-102.4-73.955555L22.755556 540.444444 358.4 56.888889C398.222222 0 477.866667-11.377778 529.066667 28.444444l420.977777 295.822223c56.888889 39.822222 68.266667 113.777778 28.444445 170.666666zM187.733333 927.288889c5.688889 11.377778 17.066667 22.755556 28.444445 22.755555l386.844444-39.822222 318.577778-455.111111c22.755556-22.755556 17.066667-56.888889-11.377778-73.955555L489.244444 85.333333c-22.755556-17.066667-56.888889-11.377778-79.644444 11.377778l-318.577778 455.111111 96.711111 375.466667z" fill="#3970fe" p-id="15335" data-spm-anchor-id="a313x.7781069.0.i43" class="selected"></path><path d="M574.577778 745.244444c-56.888889 85.333333-176.355556 108.088889-261.688889 45.511112-85.333333-56.888889-108.088889-176.355556-45.511111-261.688889s176.355556-108.088889 261.688889-45.511111c85.333333 56.888889 102.4 176.355556 45.511111 261.688888z m-56.888889-39.822222c39.822222-56.888889 22.755556-130.844444-28.444445-170.666666s-130.844444-22.755556-170.666666 28.444444c-39.822222 56.888889-22.755556 130.844444 28.444444 170.666667s130.844444 22.755556 170.666667-28.444445z" fill="#3970fe" p-id="15336" data-spm-anchor-id="a313x.7781069.0.i44" class="selected"></path></svg></a><a class="hld__extra-icon" title="拉黑此用户(屏蔽所有言论)" data-type="ban"  data-user="${current_user}"><svg t="1578452808565" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9668" data-spm-anchor-id="a313x.7781069.0.i27" width="32" height="32"><path d="M512 1024A512 512 0 1 1 512 0a512 512 0 0 1 0 1024z m0-146.285714A365.714286 365.714286 0 1 0 512 146.285714a365.714286 365.714286 0 0 0 0 731.428572z" fill="#a20106" p-id="9669" data-spm-anchor-id="a313x.7781069.0.i28" class="selected"></path><path d="M828.708571 329.142857l-633.417142 365.714286 633.417142-365.714286z m63.341715-36.571428a73.142857 73.142857 0 0 1-26.770286 99.913142l-633.417143 365.714286a73.142857 73.142857 0 0 1-73.142857-126.683428l633.417143-365.714286A73.142857 73.142857 0 0 1 892.050286 292.571429z" fill="#a20106" p-id="9670" data-spm-anchor-id="a313x.7781069.0.i31" class="selected"></path></svg></a>`)
                })
            }
            //标记拉黑备注
            if(setting.authorMark) {
                $(this).find('.b').each(function(){
                    let name = $(this).text().replace('[', '').replace(']', '')
                    if(setting.markAndBan) {
                        if(ban_list.indexOf(name) > -1) {
                            if(setting.banMode == 'STRICT') {
                                if($(this).parents('div.comment_c').length > 0) $(this).parents('div.comment_c').remove()
                                else $dom.remove()
                            }else {
                                if($(this).hasClass('author')) {
                                    if($(this).parents('div.comment_c').length > 0) $(this).parents('div.comment_c').remove()
                                    else $dom.remove()
                                }else {
                                    $(this).parent().html('<span class="hld__banned">此用户在你的黑名单中，已屏蔽其言论</span>')
                                }
                            }
                        }
                        for(let m of mark_list) {
                            const t = m.split(':')
                            if(t[0] == name) {
                                $(this).html(`<b>${t[1]}(${name})</b>`)
                            }
                        }
                    }
                    name == $('#hld__post-author').val() && $(this).append('<span class="hld__post-author">[楼主]</span>')
                })
            }
            //添加标志位
            $(this).attr('hld-render', 'ok')
        })
    }
    if(setting.imgResize) {
        $('#m_posts').on('click', '.postcontent img[hld__imglist=ready]', function(){
            resizeImg($(this))
        })
    }
    //设置面板
    let $panel_dom = $(`<div id="hld__setting_panel">
<a href="javascript:eval($(\'hld__setting_panel\').style.display=\'none\')" class="hld__setting-close">×</a>
<p class="hld__sp-title"><a title="更新地址" href="https://greasyfork.org/zh-CN/scripts/393991-nga%E4%BC%98%E5%8C%96%E6%91%B8%E9%B1%BC%E4%BD%93%E9%AA%8C" target="_blank">NGA优化摸鱼插件设置</a></p>
<p class="hld__sp-section">显示优化</p>
<p><label><input type="checkbox" id="hld__cb_hideAvatar"> 隐藏头像（快捷键切换显示[<b>Q</b>]）</label></p>
<p><label><input type="checkbox" id="hld__cb_hideSmile"> 隐藏表情（快捷键切换显示[<b>W</b>]）</label></p>
<p><label><input type="checkbox" id="hld__cb_hideImage"> 隐藏贴内图片（快捷键切换显示[<b>E</b>]）</label></p>
<p><label><input type="checkbox" id="hld__cb_hideSign"> 隐藏签名</label></p>
<p><label><input type="checkbox" id="hld__cb_hideHeader"> 隐藏版头/版规</label></p>
<p class="hld__sp-section">功能强化</p>
<p><label><input type="checkbox" id="hld__cb_linkTargetBlank"> 论坛列表新窗口打开</label></p>
<p><label><input type="checkbox" id="hld__cb_imgResize"> 贴内图片功能增强</label></p>
<p><label><input type="checkbox" id="hld__cb_authorMark"> 高亮楼主</label></p>
<p><label><input type="checkbox" id="hld__cb_markAndBan" enable="hld__sp_fold"> 拉黑/备注功能</label></p>
<div class="hld__sp-fold" id="hld__sp_fold" data-id="hld__rb_banMode">
<p class="hld__f-title">拉黑模式</p>
<p><label title="仅抽被拉黑者的楼，不抽回复的被拉黑者的楼"><input type="radio" name="hld__rb_banMode" value="SIMPLE" >仅屏蔽被拉黑者的回复</label></p>
<p><label title="一刀切模式，只要楼内与被拉者有关，一律抽楼"><input type="radio" name="hld__rb_banMode" value="STRICT">包含回复被拉黑者的回复</label></p>
<p><button id="hld__list_manage">名单管理</button></p>
</div>
<div class="hld__buttons">
<span>
<button class="hld__btn" id="hld__export__data" title="导出配置字符串，包含设置，黑名单，标记名单等等">导出</button>
<button class="hld__btn" id="hld__import__data" title="导入配置字符串">导入</button>
</span>
<button class="hld__btn" id="hld__save__data">保存设置</button>
</div>
</div>`)

    $('body').append($panel_dom)
    //本地恢复设置
    for(let k in setting) {
        if($('#hld__cb_' + k).length > 0) {
            $('#hld__cb_' + k)[0].checked = setting[k]
            const enable_dom_id = $('#hld__cb_' + k).attr('enable')
            if(enable_dom_id) {
                setting[k] ? $('#'+enable_dom_id).show() : $('#'+enable_dom_id).hide()
                $('#'+enable_dom_id).find('input').each(function(){
                    $(this).val() == setting[$(this).attr('name').substr(8)] && ($(this)[0].checked = true)
                })
                $('#hld__cb_' + k).on('click', function(){
                    $(this)[0].checked ? $('#'+enable_dom_id).slideDown() : $('#'+enable_dom_id).slideUp()
                })
            }
        }
    }
    //导出设置
    $('body').on('click', '#hld__export__data', function(){
        let obj = {
            name: 'NGA-BBS',
            setting: setting,
            ban_list: ban_list,
            mark_list: mark_list
        }
        window.prompt('导出成功，请复制以下代码以备份', Base64.encode(JSON.stringify(obj)))
    })
    //导入
    $('body').on('click', '#hld__import__data', function(){
        let base_str = window.prompt('导入字符串', '')
        base_str = $.trim(base_str)
        if(base_str) {
            let str = Base64.decode(base_str)
            if(str) {
                let obj
                try {
                    obj = JSON.parse(str)
                    setting = obj.setting
                    ban_list = obj.ban_list
                    mark_list = obj.mark_list
                    window.localStorage.setItem('hld__NGA_setting', JSON.stringify(setting))
                    window.localStorage.setItem('hld__NGA_ban_list', ban_list.join(','))
                    window.localStorage.setItem('hld__NGA_mark_list', mark_list.join(','))
                    $panel_dom.hide()
                    alert('导入成功，刷新生效')

                }catch(err){
                    alert('配置有误，导入失败')
                }
            }
        }
    })
    //保存
    $('body').on('click', '#hld__save__data', function(){
        for(let k in setting) {
            $('input#hld__cb_' + k).length > 0 && (setting[k] = $('input#hld__cb_' + k)[0].checked)
            $(`input[name="hld__rb_${k}"]`).length > 0 && (setting[k] = $(`input[name="hld__rb_${k}"]:checked`).val())
        }
        window.localStorage.setItem('hld__NGA_setting', JSON.stringify(setting))
        $panel_dom.hide()
        popMsg('保存成功，刷新页面生效')
    })
    //消息
    const popMsg = (msg) => {
        alert(msg)
    }
    function GetQueryString(name) {
        var url = decodeURI(window.location.search.replace(/&amp;/g, "&"));
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var r = url.substr(1).match(reg);
        if(r != null) return unescape(r[2]);
        return null;
    }
    function Uniq(array){
        let temp = {}, r = [], len = array.length, val, type;
        for (let i = 0; i < len; i++) {
            val = array[i];
            type = typeof val;
            if (!temp[val]) {
                temp[val] = [type];
                r.push(val);
            } else if (temp[val].indexOf(type) < 0) {
                temp[val].push(type);
                r.push(val);
            }
        }
        return r;
    }
    function RemoveBlank(array) {
        let r = [];
        array.map(function(val, index) {
            if (val !== '' && val != undefined) {
                r.push(val);
            }
        });
        return r;
    }
    const Base64 = {
        encode: (str) => {
            return window.btoa(unescape(encodeURIComponent(str)))
        },
        decode: (str) => {
            try {
                return decodeURIComponent(escape(window.atob(str)))
            }catch(err){
                alert('字符串有误，导入失败')
            }
        }
    }
    //样式
    let style = document.createElement("style")
    style.type = "text/css"
    style.appendChild(document.createTextNode(`
.postcontent img {
margin: 0 5px 5px 0;
}
#hld__img_full{
position: fixed;
top: 0;
left: 0;
right: 0;
bottom: 0;
background: rgba(0, 0, 0, 0.6);
z-index: 99999;
/*display: flex;*/
/*align-items: center;*/
/*justify-content: center;*/
}
#hld__img_full img{
position: absolute;
display:block;
width:auto;
max-width:auto;
cursor: move;
transition: transform .2s ease;
}
#hld__img_full .hld__imgcenter{
top: 50%;
left: 50%;
transform: translate(-50%, -50%);
}
.hld__if_control {
position: absolute;
display:flex;
left:50%;
bottom: 15px;
width: 160px;
margin-left:-80px;
height: 40px;
background: rgba(0, 0, 0, 0.6);
z-index:9999999;
}
#hld__img_full .change {
width: 40px;
height: 40px;
cursor:pointer;
}
#hld__img_full .rotate-right,
#hld__img_full .rotate-left{
background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAgCAYAAAB6kdqOAAADYElEQVRYR8WYS8hWVRSGn3cipg0qCExBKYxKQVJRIh1olF0GXpIIoVIUBZWahZeJOpDEQYMcWCBZQRFCZkpGJGgD0yJSwSyVIO0yMrpObPLK+tvnY3f8zu1Tfxfsydlrrf3uve5HXAPZfgR4HJiY1r3Av8BvwCXgOPChpCNtj1FbxoLPdhy+AHgaeLil/DngHWCHpL/qZDoBsj0P+LQliH5s3yVQO6t0dAW0GdhUUvYP8DXwc1q3AncBYb4pFQfvlrS8314nQKHA9n5gDnAKWCfpi6rbJvM+CSwFppf4jkiaW5btDGhQc9leBbwKjM50vC5pda5z2ACl170P+AS4OwOxRVK4whANK6AsUk8DkzNQiyXtvZmAJqVAuCWB6vnTTXmhZL5yxK6UtOsqQLaD8UdJbw3qwG3kbEdqiHQxNvHvlbT4f4Bsn08lIHg2SNrWRnm68e3APUBk4ouSLjfJ2n4DiOgLuiTpzh4g248Cn5WUrJFUmVUzJ80Vx+efgBeaapjtZ4A92ZnTckCvAOv73Oo5Se9W3db2i8BrFfuTJZ2peynbzvYX5IC+AaZWCM+XdKC8Z/s24PeaA49Kmt0A6JfMj1YMAbIdQAJQFf0JLCybwPaDwIkauSG/aAAUjl2UlXUFoJeB7Q1OeBFYJKkH3Hbkk29r5H6VNG4QQMeAh5qiAjgpqWdW2yOBePI7KmQPSJrfyWS2J0TeaQGmYJmbm64UumU1EyX90MmpG6KkrOsPYLykv/MN2wuBjcCM9D3q0kuS4vUqyfYyYHfGME22D6f+pk72SyD6nv11ucV2NGSRFAN4I9l+D1iSGP9LjLYPAtFEVdEhSY81au/IYPuB8ElgRPGqvdJhO7JlhOfnwAfAE6WoWyHpzY5n1rLb3prMXPD1L67Fru3IsHGLoJgaZkmK0eaayfZMINygoOb2w/azwPuZ0EfA82WHHgRdqVyEinYNmu2PgafymwDLJF0YEEj4avhsTu1bWNsxykRhLcI5FIUjhpJ9XUClJj+6gpy6N/mpkYqpM9qTnGI8fruukbthY5DtGP4C1KI+rxI5JzJ9rHD+UcM2KNpeC6wBoqgOQtd3lA4E6bUKYONbooqxJyL2+v5syA+3PSaVnPuBGACLFb9ivgfOAl9FyWkqsLneKyNmUcarECm7AAAAAElFTkSuQmCC) center no-repeat;
background-size: 25px;
}
#hld__img_full .rotate-right {
transform: rotateY(180deg);
}
#hld__img_full .rotate-left:hover {
transform: scale(1.2);
}
#hld__img_full .rotate-right:hover {
transform: scale(1.2) rotateY(180deg);
}
#hld__img_full .next-img:hover {
transform: scale(1.2) rotate(180deg);
}
#hld__img_full .prev-img,
#hld__img_full .next-img{
background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABmUlEQVRYR+3WsUtWURjH8e8z+J/4J7QF4vL+C5ZBiAoh6lCDDQmBoIMOOiiIoBCBU+DiUENRQUWigiAuCjoo5JAmkQ41/OTCEzxEwznnvr4u750vfD/nOfdcjnHLj91ynzagqROQ1AC2zOxH6tY2DSBpAnju4Ttmtp2CaApA0hTwLAT7zexFSwCSZoCxENsDuszs/MYBkuaAxyG0A9wzs/2UePVO8RZIWgBGQmgTuG9mh6nxYoCkJeBRCH3x+HFOvAggaQUYCKGPQK+ZfcuNZwMkvQQehtA7X/n3kngWQNIn4G4IvfGVX5TGkwGSDoDOEFr3+GWdeA7gN9DhsV9Aw8y+1o3nAN4D3SF45BPYqItI/g9IGgcmQ7A6ctXX/7kOIhlQRSQ9BaZD8NQRH0oRWQBHPAFmQ/DMj+LbEkQ2wBGjwHwI/nTE61xEEcARQ8BiCF45ojqiyU8xwBGDwHKo/XHEWqqgFsARfcC/l4+W34geAKth1T1m9iplCrUn8DciqceP6C4wbGYnLQWkxP73TtMm0Aa0J1A6gWvfCH8hDgZXwQAAAABJRU5ErkJggg==) center no-repeat;
}
#hld__img_full .next-img {
transform: rotate(180deg);
}
#hld__img_full .prev-img:hover {
transform: scale(1.2);
}
#hld__img_full .next-img:hover {
transform: scale(1.2) rotate(180deg);
}
#hld__setting {
color:#6666CC;
}
#hld__banlist_panel {
position:fixed;
top:150px;
left:50%;
transform: translateX(-50%);
background:#fff8e7;
width:370px;
height:300px;
padding: 15px 20px;
border-radius: 10px;
box-shadow: 0 0 10px #666;
border: 1px solid #591804;
}
#hld__banlist_panel > div{
display:flex;
justify-content: space-between;
}
#hld__banlist_panel .hld__list-c{
width: 45%;
}
#hld__banlist_panel .hld__list-c textarea{
height:200px;
width:100%;
resize: none;
}
#hld__banlist_panel .hld__list-desc {
font-size:9px;
color:#666;
}
#hld__banlist_panel .hld__list-c > p:first-child{
weight:bold;
font-size:14px;
margin-bottom:10px;
}
#hld__setting_panel {
display:none;
position:fixed;
top:70px;
left:50%;
transform: translateX(-50%);
background:#fff8e7;
width:242px;
padding: 15px 20px;
border-radius: 10px;
box-shadow: 0 0 10px #666;
border: 1px solid #591804;
}
#hld__setting_panel p{
margin-bottom:10px;
}
#hld__setting_panel .hld__sp-title {
font-size: 15px;
font-weight: bold;
text-align: center;
}
#hld__setting_panel .hld__sp-section{
font-weight: bold;
margin-top: 20px;
}
.hld__setting-close{
position: absolute;
top: 5px;
right: 5px;
padding: 3px 6px;
background: #fff0cd;
color: #591804;
transition: all .2s ease;
cursor:pointer;
border-radius: 4px;
text-decoration: none;
}
.hld__setting-close:hover{
background: #591804;
color: #fff0cd;
text-decoration: none;
}
#hld__setting_panel button {
transition: all .2s ease;
cursor:pointer;
}
button.hld__btn {
padding: 3px 8px;
border: 1px solid #591804;
background: #fff8e7;
color: #591804;
}
button.hld__btn:hover {
background: #591804;
color: #fff0cd;
}
button.hld__save-btn {
margin-top:10px;
margin-left: 50%;
transform: translateX(-50%);
}

.hld__post-author {
color:#F00;
font-weight:bold;
}
.hld__extra-icon {
padding: 0 2px;
cursor:pointer;
background-repeat: no-repeat;
background-position: center;
}
.hld__extra-icon svg{
width:10px;
height:10px;
vertical-align: -0.15em;
fill: currentColor;
overflow: hidden;
}
.hld__extra-icon:hover{
text-decoration:none;
}
span.hld__banned {
color:#ba2026;
}
.hld__sp-fold {
padding-left:23px;
}
.hld__sp-fold .hld__f-title {
font-weight:bold;
}
.hld__buttons {
display:flex;
justify-content: space-between;
}
#loader{
display:none;
position: absolute;
top: 50%;
left: 50%;
margin-top:-10px;
margin-left:-10px;
width: 20px;
height: 20px;
border: 6px dotted #FFF;
border-radius: 50%;
-webkit-animation: 1s loader linear infinite;
animation: 1s loader linear infinite;
}
@keyframes loader {
0% {
-webkit-transform: rotate(0deg);
transform: rotate(0deg);
}
100% {
-webkit-transform: rotate(360deg);
transform: rotate(360deg);
}
}

`))
    document.getElementsByTagName("head")[0].appendChild(style)

})();