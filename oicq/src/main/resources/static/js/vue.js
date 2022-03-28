let id = sessionStorage.getItem("id");
let socket;
let myDate = new Date();
let app = new Vue({
        el:"#app",
        data:{
                user_id :-1,
                my_nickname : "",
                my_email:"",
                my_signature:"",
                my_phone:"",
                my_sex:"",
                my_birthday:"",
                nickname_edit:"",
                sex_edit:"",
                birthday_edit:"",
                phone_edit:"",
                signature_edit:"",
                profile_url:"",
                register_time:"",
                old_pw:"",
                new_pw:"",
                notices:[],//系统通知
                chat_window:false,
                notice_check:true,//通知提醒
                new_friend_keyword:"",
                new_users:[],
                online_users:[],//在线用户
                online_ids:"",
                add_friend_panel:false,//加好友面板
                add_who:"",//加谁
                add_msg:"",//验证消息
                friends:[],//我的好友列表
                chatting_with:-1,//当前聊天窗口
                messages_show:[],//控制显示聊天记录的
                typing_text:"",//待发送的消息
                profile_show:false,
                chat_show:false,
                images:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18],
                img_show:true
        },
        methods:{
                //更换头像
                change_profile(index){
                        let that = this;
                        let url1 = '/images/user-'+index+'.png';
                        axios.post('/change_profile',
                            {id:that.user_id, url: url1
                            }).then(function (response) {
                                if(response.data.status===200)
                                {
                                        that.profile_url = url1;
                                        alert('更换成功！');
                                }else
                                        alert(response.data.msg);
                        }).catch(function () {
                                console.log("服务器未响应！code 14");
                        })
                },
                //注销登录
                logout(){
                        let r = confirm('是否注销登录？');
                        if(r){
                                window.location.href="/logout";
                        }
                },
                //删除好友
                delete_friend(){
                        if(this.chatting_with===-1){
                                alert('请先选择对象！');
                                return;
                        }
                        let r = confirm('是否删除该好友？');
                        if(r){
                                let that = this;
                                axios.post('/delete_friend',{
                                        me:that.user_id,
                                        friend:that.friends[that.chatting_with].id.toString(),
                                }).then(function (response) {
                                        if(response.data.status===200)
                                        {
                                                alert('操作成功！');
                                                window.location.reload();
                                        }else
                                                alert(response.data.msg);
                                }).catch(function () {
                                        console.log("服务器未响应！code 13");
                                })
                        }
                },
                //清除聊天记录
                clear_message_record(){
                        if(this.chatting_with===-1){
                                alert('请先选择对象！');
                                return;
                        }
                        let r = confirm('是否清除全部聊天记录？');
                        if(r){
                                let that = this;
                                axios.post('/clear_record',{
                                        me:that.user_id,
                                        friend:that.friends[that.chatting_with].id.toString(),
                                }).then(function (response) {
                                        if(response.data.status===200)
                                        {
                                               alert('操作成功！');
                                               window.location.reload();
                                        }else
                                                alert(response.data.msg);
                                }).catch(function () {
                                        console.log("服务器未响应！code 13");
                                })
                        }
                },
                //打开信息主页
                open_my_profile_window(){
                        this.chatting_with = -1;
                        this.chat_window = false;
                        this.profile_show = true;
                },
                open_profile_window(){
                        this.chat_window = false;
                        this.profile_show = true;
                },
                //关闭信息主页
                close_profile_window(){
                        this.profile_show = false;
                        this.chat_window = this.chatting_with !== -1;
                },
                //发送消息
                send_message(){
                        if(this.typing_text===""){
                                alert('不能发送空消息！');
                                return;
                        }
                        if(this.chatting_with===-1){
                                alert('请先选择对象！');
                                return;
                        }
                        //通过web socket对方发送时时消息
                        let message = {from:this.user_id,to:this.friends[this.chatting_with].id.toString(),text:this.typing_text}
                        socket.send(JSON.stringify(message));
                        //显示到本地
                        let msg = [];
                        msg.type = 'out';
                        msg.content = this.typing_text;
                        this.friends[this.chatting_with].lastChat = this.typing_text;
                        this.friends[this.chatting_with].lastChatTime = myDate.getHours()+":"+myDate.getMinutes();
                        this.friends[this.chatting_with].messages.push(msg);
                        //将消息保存到数据库
                        let that = this;
                        axios.post('/send_message',{
                                from:that.user_id,
                                to:that.friends[that.chatting_with].id.toString(),
                                content:that.typing_text
                        }).then(function (response) {
                                if(response.data.status===200)
                                {
                                        that.typing_text = "";
                                }else
                                        alert(response.data.msg);
                        }).catch(function () {
                                console.log("服务器未响应！code 12");
                        })
                        
                },
                //获取聊天信息
                get_message(){
                          let that = this;
                          for(let i=0;i<that.friends.length;i++){
                                  axios.post('/get_message',{
                                          me:that.user_id,
                                          friend:that.friends[i].id.toString()
                                  }).then(function (response) {
                                          if(response.data.status===200){
                                                  let messages = response.data.messages;
                                                  for(let j=0;j<messages.length;j++){
                                                          let message = [];
                                                          message.type = messages[j].from==that.user_id?'out':'in';
                                                          message.content = messages[j].content;
                                                          that.friends[i].messages.push(message);
                                                          that.friends[i].lastChat = messages[j].content;
                                                  }
                                          }else
                                          {
                                                  console.log('获取消息列表出错！');
                                          }
                                  }).catch(function () {
                                          console.log("服务器未响应！code 11");
                                  })
                          }
                },
                //获取好友列表
                get_friend_list(){
                        let that = this;
                        axios.post('/get_friend_list',{
                                id:that.user_id
                        }).then(function (response) {
                                if(response.data.status===200)
                                {
                                        let friends = response.data.friends;
                                        for(let i=0;i<friends.length;i++){
                                                let friend = [];
                                                friend.id = friends[i].id;
                                                friend.nickname = friends[i].nickname;
                                                friend.email = friends[i].email;
                                                friend.url = friends[i].url;
                                                friend.sex = friends[i].sex;
                                                friend.phone = friends[i].phone;
                                                friend.signature = friends[i].signature;
                                                friend.birthday = friends[i].birthday;
                                                friend.messages = [];// 聊天信息列表
                                                friend.lastChatTime = "";//上一次聊天时间
                                                friend.lastChat = "";//最后一句话
                                                friend.uncheck = 0;//未读消息
                                                that.friends.push(friend);
                                        }
                                        that.get_message();
                                }
                                else {
                                        alert("获取好友列表失败！"+response.data.msg);
                                }
                        }).catch(function () {
                                console.log("服务器未响应！code 10");
                        })
                },
                //同意好友请求
                agree_apply(id){
                        let that = this;
                        axios.post('/agree_apply',{
                                userId:that.user_id,
                                noticeId:id.toString()
                        }).then(function (response) {
                                if(response.data.status===200)
                                {
                                        alert("操作成功！");
                                        window.location.reload();
                                }
                                else {
                                        alert("操作失败！"+response.data.msg);
                                }
                        }).catch(function () {
                                console.log("服务器未响应！code 9");
                        })
                },
                //删除系统消息
                delete_notice(id){
                        let that = this;
                        axios.post('/delete_notice',{
                                userId:that.user_id,
                                noticeId:id.toString()
                        }).then(function (response) {
                                if(response.data.status===200)
                                {
                                        alert("操作成功！");
                                        that.get_notice();
                                }
                                else {
                                        alert("操作失败！"+response.data.msg);
                                }
                        }).catch(function () {
                                console.log("服务器未响应！code 8");
                        })
                },
                //获取系统消息
                get_notice(){
                        this.notices = [];
                        let that = this;
                        axios.post('/get_notice',{
                                id:that.user_id,
                        }).then(function (response){
                                if(response.data.status===200){
                                        let notices = response.data.notices;
                                        for(let i =0;i<notices.length;i++){
                                                let notice = [];
                                                //我的申请信息
                                                if (notices[i].from==that.user_id){
                                                        if(notices[i].type==0){
                                                                notice.id=notices[i].id;
                                                                notice.type="等待验证";
                                                                notice.content = '您于'+notices[i].time+"向"+notices[i].toName+"发送的好友申请在等待验证...";
                                                                notice.time = notices[i].time;
                                                                that.notices.push(notice);
                                                        }
                                                }else if(notices[i].to==that.user_id){
                                                        notice.id=notices[i].id;
                                                        if(notices[i].type==0){
                                                                notice.type="好友验证";
                                                                notice.content = notices[i].toName+"于"+notices[i].time+"向你发起好友申请 验证信息:"+notices[i].msg;
                                                                notice.time = notices[i].time;
                                                        }else if(notices[i].type==1)
                                                        {
                                                                notice.type="验证成功";
                                                                notice.content = notices[i].toName+"于"+notices[i].time+"同意了您的好友申请";
                                                                notice.time = notices[i].time;
                                                        }else if(notices[i].type==2){
                                                                notice.type="拒绝信息";
                                                                notice.content = notices[i].toName+"于"+notices[i].time+"拒绝了您的好友申请";
                                                                notice.time = notices[i].time;
                                                        }else if(notices[i].type==3){
                                                                notice.type="删除通知";
                                                                notice.content = notices[i].toName+"于"+notices[i].time+"将你移除了好友列表";
                                                                notice.time = notices[i].time;
                                                        }
                                                        that.notices.push(notice);
                                                }

                                        }
                                }
                                else{
                                        alert("发送失败！");
                                }
                                that.close_add_friend_panel();
                        }).catch(function () {
                                console.log("服务器未响应！code 3");
                        })
                },
                //发送加好友申请
                post_add_apply(){
                        let that = this;
                        axios.post('/post_add_apply',{
                                from:that.user_id,
                                to:that.add_who.toString(),
                                msg:that.add_msg,
                        }).then(function (response){
                                if(response.data.status===200){
                                        alert("发送成功！");
                                        that.get_notice();
                                }
                                else if(response.data.status===100){
                                        alert("发送失败"+response.data.msg);
                                }
                                else{
                                        alert("发送失败！");
                                }
                                that.close_add_friend_panel();
                        }).catch(function () {
                                console.log("服务器未响应！code 2");
                        })
                },
                show_add_friend_panel(id){
                        this.add_who = id;
                        this.add_friend_panel=true;
                },
                close_add_friend_panel(){
                        this.add_who = "";
                        this.add_friend_panel = false;
                },
                clear_notice(){
                        this.notice_check = false;
                },
                open_chat_window(index){
                        this.chatting_with = index;
                        this.messages_show = this.friends[index].messages;
                        this.chat_window = true;
                        this.friends[index].uncheck = 0;
                },
                close_chat_window(){
                        this.chatting_with = -1;
                        this.chat_window = false;
                },
                search_user(){
                        let that = this;
                        axios.post('/search_user',{
                                id:that.user_id,
                                keyword:that.new_friend_keyword
                        }).then(function (response){
                                if(response.data.status===200){
                                        let users = response.data.users;
                                        that.new_users = [];
                                        for(let i=0;i<users.length;i++){
                                                let user = [];
                                                user.id = users[i].id;
                                                user.nickname = users[i].nickname;
                                                user.email = users[i].email;
                                                user.url = users[i].url;
                                                that.new_users.push(user);
                                        }
                                }else if(response.data.status===100){
                                        that.new_users = [];
                                }
                                else{
                                        alert("搜索出错！");
                                }
                        }).catch(function () {
                                console.log("服务器未响应！code 4");
                        })
                },
                get_my_info(){
                        let that = this;
                        axios.post('/get_my_info',{
                                id:that.user_id
                        }).then(function (response){
                                if(response.data.status===200){
                                        that.nickname_edit = that.my_nickname = response.data.user.nickname;
                                        that.my_email = response.data.user.email;
                                        that.sex_edit = that.my_sex=response.data.user.sex;
                                        that.phone_edit = that.my_phone =  response.data.user.phone;
                                        that.birthday_edit = that.my_birthday = response.data.user.birthday;
                                        that.signature_edit = that.my_signature = response.data.user.signature;
                                        that.profile_url = response.data.user.url;
                                        that.register_time = response.data.user.register_time;
                                }
                                else{
                                        alert("获取用户信息出错！");
                                }
                        }).catch(function () {
                                console.log("服务器未响应！code 5");
                        })
                },
                update_my_info(){
                        let that = this;
                        axios.post('/update_my_info',{
                                id:that.user_id,
                                nickname:that.nickname_edit,
                                sex:that.sex_edit,
                                birthday:that.birthday_edit,
                                phone:that.phone_edit,
                                signature:that.signature_edit
                        }).then(function (response){
                                if(response.data.status===200){
                                        that.my_nickname = that.nickname_edit;
                                        that.my_phone = that.phone_edit;
                                        that.my_birthday = that.birthday_edit;
                                        that.my_signature = that.signature_edit;
                                        alert("修改成功！");
                                }
                                else{
                                        alert("获取用户信息出错！");
                                }
                        }).catch(function () {
                                console.log("服务器未响应！code 6");
                        })
                },
                change_password(){
                        if(this.old_pw===""||this.new_pw===""){
                                alert("不允许为空！");
                                return;
                        }
                        let that = this;
                        axios.post('/change_password',{
                                id:that.user_id,
                                old_pw:that.old_pw,
                                new_pw: that.new_pw
                        }).then(function (response){
                                if(response.data.status===200){
                                        that.old_pw="";
                                        that.new_pw="";
                                        alert("修改成功！");
                                }
                                else if(response.data.status===100){
                                        alert(response.data.msg);
                                }
                                else{
                                        alert("获取用户信息出错！");
                                }
                        }).catch(function () {
                                console.log("服务器未响应！code 7");
                        })
                },
                get_online_user(){
                        let that = this;
                        axios.post('/get_online',{
                                ids:that.online_ids
                        }).then(function (response){
                                if(response.data.status===200){
                                        let users = response.data.users;
                                        that.online_users = [];
                                        for(let i=0;i<users.length;i++){
                                                let user = [];
                                                user.id = users[i].id;
                                                user.nickname = users[i].nickname;
                                                user.email = users[i].email;
                                                user.url = users[i].url;
                                                that.online_users.push(user);
                                        }
                                }else if(response.data.status===100){
                                        that.online_users = [];
                                }
                                else{
                                        alert("搜索出错！");
                                }
                        }).catch(function () {
                                console.log("服务器未响应！code 1");
                        })
                },
                get_index_of_friend(id){
                  for(let i=0;i<this.friends.length;i++){
                          if(this.friends[i].id==id){
                                  return i;
                          }
                  }
                  return -1;
                },
                socket_init(){
                        let that = this;
                        if(typeof (WebSocket) == "undefined"){
                                console.log("您的浏览器不支持websocket");
                        }else{
                                let socketUrl = "ws://socket服务器地址:服务端口/socket/"+this.user_id;
                                if(socket!=null){
                                        socket.close();
                                        socket = null;
                                }
                                socket = new WebSocket(socketUrl);
                                //打开事件
                                socket.onopen = function () {
                                        console.log("websocket已经打开");
                                }
                                //获取消息事件.
                                socket.onmessage = function (msg) {
                                        let data = JSON.parse(msg.data);
                                        if(data.type===0)//用户登录提醒
                                        {
                                                let notice = [];
                                                notice.type="登录提醒";
                                                notice.content = '您于'+data.time+"登录OICQ";
                                                notice.time = myDate.getHours()+':'+myDate.getMinutes();
                                                that.notices.push(notice);
                                        }else if(data.type===1)
                                        {
                                                that.online_ids = data.ids;
                                                that.get_online_user();
                                        }else if(data.type===2){
                                                let msg = [];
                                                msg.type = 'in';
                                                msg.content = data.text;
                                                let index = that.get_index_of_friend(data.from);
                                                if(index!==-1){
                                                        that.friends[index].messages.push(msg);
                                                        that.friends[index].uncheck++;
                                                        that.friends[index].lastChat = data.text;
                                                        that.friends[index].lastChatTime = myDate.getHours()+":"+myDate.getMinutes();
                                                }
                                        }
                                }
                        }
                }
        },
        created:function () {
                this.user_id = id;
                //获取用户信息
                this.get_my_info();
                //获取好友列表
                this.get_friend_list();
                //获取系统消息
                this.get_notice();
                //初始化socket链接
                this.socket_init();
                let friend = []
                friend.url = "/images/normal.png";//防止切换聊天好友时头像出错的问题
                this.friends[-1] = friend;
        }
})

