package com.energy;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;

//annotation used to start the app for this test
@QuarkusTest
class GreetingResourceTest {

    @Test
    //prepare a request, and do a GET on /hello
    void helloEndpointSaysHello() {
        given()
            .when().get("/hello")
            .then()
                //the response status must be 200
                .statusCode(200)
                //the body text must be exactly that string
                .body(is("Hello from Quarkus REST"));
    }
}
