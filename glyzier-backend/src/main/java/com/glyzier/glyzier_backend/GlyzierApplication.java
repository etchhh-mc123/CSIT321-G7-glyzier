package com.glyzier.glyzier_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.autoconfigure.http.client.HttpClientAutoConfiguration;
import org.springframework.boot.autoconfigure.web.client.RestClientAutoConfiguration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(
	scanBasePackages = {"com.glyzier"},
	exclude = {HttpClientAutoConfiguration.class, RestClientAutoConfiguration.class}  // Exclude to avoid HttpClient5 SSL dependency issues
)
@EnableJpaRepositories(basePackages = "com.glyzier.repository")
@EntityScan(basePackages = "com.glyzier.model")
public class GlyzierApplication {

	public static void main(String[] args) {
		SpringApplication.run(GlyzierApplication.class, args);
	}

}

//did dome UI changes here