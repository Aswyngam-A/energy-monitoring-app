# Stage 1: build the application with Maven (this stage is thrown away afterwards).
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
# Copy pom.xml first: the dependency layer below is cached until the pom changes.
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

# Stage 2: small runtime image with only a JRE and the built app.
FROM registry.access.redhat.com/ubi9/openjdk-21-runtime:1.24
COPY --chown=185 --from=build /build/target/quarkus-app/lib/ /deployments/lib/
COPY --chown=185 --from=build /build/target/quarkus-app/app/ /deployments/app/
COPY --chown=185 --from=build /build/target/quarkus-app/quarkus/ /deployments/quarkus/
COPY --chown=185 --from=build /build/target/quarkus-app/quarkus-run.jar /deployments/quarkus-run.jar

EXPOSE 8080
USER 185
ENV JAVA_OPTS_APPEND="-Dquarkus.http.host=0.0.0.0 -Djava.util.logging.manager=org.jboss.logmanager.LogManager"
ENV JAVA_APP_JAR="/deployments/quarkus-run.jar"

ENTRYPOINT [ "/opt/jboss/container/java/run/run-java.sh" ]
