package com.onedata;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext;

@Component
@Profile("desktop")
public class DesktopReady {
    private final ServletWebServerApplicationContext context;

    public DesktopReady(ServletWebServerApplicationContext context) {
        this.context = context;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void ready() {
        System.out.println("ONE_DATA_DESKTOP_PORT=" + context.getWebServer().getPort());
        System.out.flush();
    }
}
