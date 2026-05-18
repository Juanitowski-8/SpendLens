# Build stage
FROM eclipse-temurin:17-jdk AS build

WORKDIR /app

COPY backend/mvnw backend/pom.xml ./
COPY backend/.mvn ./.mvn

RUN chmod +x mvnw

RUN ./mvnw dependency:go-offline -B

COPY backend/src ./src

RUN ./mvnw clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8081

CMD ["java", "-jar", "app.jar"]
