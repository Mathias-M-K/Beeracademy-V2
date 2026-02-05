# Beeracademy Backend


This project uses Quarkus, the Supersonic Subatomic Java Framework.

If you want to learn more about Quarkus, please visit its website: <https://quarkus.io/>.

## Deploy from local
Changes to the application can be deployed from your local machine, and it's pretty easy!
>It does require that kubectl is configured to point to the cluster where you want to deploy

1. Make sure docker is running on your machine. 

2. Make sure that you're logged in
     ```bash
     docker login ghcr.io
     ```
   Use GitHub name as username and a personal access token as password with at least `read:packages` and 
`write:packages` scopes.
   It should remember your login for a long time, so it's more or less a one-time+occasionally thing. <br><br>

3. Run the Gradle task `manual_deploy`. 
    ```shell
    ./gradlew manual_deploy
    ```
   This task does the following:
    - runs a clean to remove old artifacts
    - builds the application
    - builds a Docker image
    - pushes the Docker image to GitHub Container Registry
    - updates the Kubernetes deployment to use the new image
   
And this should be it. Your application should be deployed with your latest changes :) 


## Generating private and public keys
openssl genrsa -out rsaPrivateKey.pem 2048

```console
openssl genrsa -out rsaPrivateKey.pem 2048
openssl rsa -pubout -in rsaPrivateKey.pem -out publicKey.pem
```
```console
openssl pkcs8 -topk8 -nocrypt -inform pem -in rsaPrivateKey.pem -outform pem -out privateKey.pem
```

Then take the publicKey and privateKey files and copy their content into resources file.

## Running the application in dev mode

You can run your application in dev mode that enables live coding using:

```shell script
./gradlew quarkusDev
```

> **_NOTE:_**  Quarkus now ships with a Dev UI, which is available in dev mode only at <http://localhost:8080/q/dev/>.

## Packaging and running the application

The application can be packaged using:

```shell script
./gradlew build
```

It produces the `quarkus-run.jar` file in the `build/quarkus-app/` directory.
Be aware that it’s not an _über-jar_ as the dependencies are copied into the `build/quarkus-app/lib/` directory.

The application is now runnable using `java -jar build/quarkus-app/quarkus-run.jar`.

If you want to build an _über-jar_, execute the following command:

```shell script
./gradlew build -Dquarkus.package.jar.type=uber-jar
```

The application, packaged as an _über-jar_, is now runnable using `java -jar build/*-runner.jar`.

## Creating a native executable

You can create a native executable using:

```shell script
./gradlew build -Dquarkus.native.enabled=true
```

Or, if you don't have GraalVM installed, you can run the native executable build in a container using:

```shell script
./gradlew build -Dquarkus.native.enabled=true -Dquarkus.native.container-build=true
```

You can then execute your native executable with: `./build/beeracademy-backend-1.0.0-runner`

If you want to learn more about building native executables, please consult <https://quarkus.io/guides/gradle-tooling>.

## Provided Code

### REST

Easily start your REST Web Services

[Related guide section...](https://quarkus.io/guides/getting-started-reactive#reactive-jax-rs-resources)

[![Quality gate](https://sonarcloud.io/api/project_badges/quality_gate?project=beeracademy-backend)](https://sonarcloud.io/summary/new_code?id=beeracademy-backend)
