package com.oicq.config;


import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;


@Configuration
public class WebConfiguration implements WebMvcConfigurer {
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new com.oicq.config.LoginInterceptor())
                .addPathPatterns("/index");
        WebMvcConfigurer.super.addInterceptors(registry);
    }
//    @Override
//    public void addResourceHandlers(ResourceHandlerRegistry registry) {
//        registry.addResourceHandler("/avatar/**").addResourceLocations("file:/home/avatar/");
//        registry.addResourceHandler("/profile/**").addResourceLocations("file:/home/profile/");
//    }
}



