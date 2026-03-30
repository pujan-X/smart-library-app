# Stage 1: Build the Spring Boot app using Maven
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run the compiled app
FROM eclipse-temurin:17-jre
WORKDIR /app
# Copies the .jar file generated in Stage 1
COPY --from=build /app/target/*.jar app.jar
# Exposes the port your app runs on
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]