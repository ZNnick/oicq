package com.websocket_server.component;

import cn.hutool.core.date.DateTime;
import cn.hutool.core.date.DateUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import org.springframework.stereotype.Component;

import javax.websocket.*;
import javax.websocket.server.PathParam;
import javax.websocket.server.ServerEndpoint;
import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;


@ServerEndpoint("/socket/{userId}")
@Component
public class WebSocketServer {
    /**
    *记录当先在线数量
     **/


    public static final Map<String,Session> sessionMap = new ConcurrentHashMap<>();

    @OnOpen
    public void onOpen(Session session, @PathParam("userId")String userId){
        if(userId==null)    return;
        System.out.println("用户："+userId+"已连接websocket服务器");
        sessionMap.put(userId,session);

        Date date = new DateTime();
        String dataString = DateUtil.formatChineseDate(date,false);
        JSONObject jsonObject = new JSONObject();
        jsonObject.put("type",0);
        jsonObject.put("time",dataString);
        this.sendMessage(jsonObject.toString(),session);

        //群发
        JSONObject online = new JSONObject();
        online.put("type",1);
        StringBuilder ids = new StringBuilder();
        for(Object key:sessionMap.keySet())
        {
            ids.append(key.toString());//序列化id
            ids.append(',');
        }
        String iDs = ids.substring(0,ids.length()-1);
        online.put("ids",iDs);
        this.sendAllMessage(online.toString());
    }
    @OnClose
    public void onClose(Session session,@PathParam("userId") String userId){
        sessionMap.remove(userId);
        //群发
        JSONObject online = new JSONObject();
        online.put("type",1);
        StringBuilder ids = new StringBuilder();
        for(Object key:sessionMap.keySet())
        {
            ids.append(key.toString());//序列化id
            ids.append(',');
        }
        String iDs = ids.length()>0?ids.substring(0,ids.length()-1):ids.toString();
        online.put("ids",iDs);
        this.sendAllMessage(online.toString());
    }
    @OnMessage
    public void onMessage(String message,Session session,@PathParam("userId") String userId){
        JSONObject obj = JSONUtil.parseObj(message);
        String toUser = obj.getStr("to");
        String text = obj.getStr("text");
        Session toSession = sessionMap.get(toUser);
        if(toSession!=null){
            JSONObject jsonObject = new JSONObject();
            jsonObject.put("from",userId);
            jsonObject.put("text",text);
            jsonObject.put("type",2);
            this.sendMessage(jsonObject.toString(),toSession);
        }else {
            System.out.println("未找到目标session："+toUser);
        }
    }
    @OnError
    public void onError(Session session,Throwable error){
        error.printStackTrace();
    }

    private void sendMessage(String message,Session toSession){
        try {
            toSession.getBasicRemote().sendText(message);
        }catch (Exception e){
            e.printStackTrace();
        }
    }

    private void sendAllMessage(String message){
        try {
            for(Session session : sessionMap.values()){
                session.getBasicRemote().sendText(message);
            }
        }catch (Exception e){
            e.printStackTrace();
        }
    }

}
