# Beeracademy Angular Frontend

## Package.json scripts
### openAPi
- `openApi` : Generates the Angular API client from the OpenAPI spec file located in `openapi-spec/openapi.json`.
- `openApi:fetch` : Copies the OpenAPI spec file from the backend build folder to the frontend `openapi-spec` folder.
- `openApi:local` : Runs both `openApi:fetch` and `openApi` scripts in sequence for local development.

### docker
- `docker:build` : Builds the Docker image for the Angular application.
- `docker:push` : Pushes the Docker image to the GitHub Container Registry.

### kubectl
- `kubectl:deploy` : Updates the Kubernetes deployment to use the latest Docker image from the GitHub Container Registry.

## Docker
The Angular application can't build without an OpenApi spec file. In the CI/CD pipeline, this file is fetched as an artifact, 
but locally we need to ensure it exist before building an image.

Furthermore, it's possible to also push the docker image to the GitHub container registry `ghcp`


### Prerequisites
- Make sure to do a clean build with the backend, to generate the latest openapi spec
- Run the `openApi:fetch` script from `package.json`. This copies the openapi.json file from backend/build folder to frontend/openapi-spec.

### Docker build
Build the image
```bash
docker build -t ghcr.io/mathias-m-k/beer-academy-frontend .
```

### Push to Github Container Registry

Start by make sure you're logged in to the container registry
```bash
docker login ghcr.io
```

When completed, you can do a push

```bash
docker push ghcr.io/mathias-m-k/beer-academy-frontend:latest
```
And viola, you should be able to see the package at [Github Packages](https://github.com/Mathias-M-K?tab=packages)
>This process is also described in the backend, with automatic Gradle tasks to do a local deploy of the latest package

## Building
To install the required dependencies and to build the typescript sources run:

```console
npm install
npm run build
```

### General usage

In your Angular project:

```typescript

import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideApi } from '';

export const appConfig: ApplicationConfig = {
    providers: [
        // ...
        provideHttpClient(),
        provideApi()
    ],
};
```

**NOTE**
If you're still using `AppModule` and haven't [migrated](https://angular.dev/reference/migrations/standalone) yet, you can still import an Angular module:
```typescript
import { ApiModule } from '';
```

If different from the generated base path, during app bootstrap, you can provide the base path to your service.

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideApi } from '';

export const appConfig: ApplicationConfig = {
    providers: [
        // ...
        provideHttpClient(),
        provideApi('http://localhost:9999')
    ],
};
```

```typescript
// with a custom configuration
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideApi } from '';

export const appConfig: ApplicationConfig = {
    providers: [
        // ...
        provideHttpClient(),
        provideApi({
            withCredentials: true,
            username: 'user',
            password: 'password'
        })
    ],
};
```

```typescript
// with factory building a custom configuration
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideApi, Configuration } from '';

export const appConfig: ApplicationConfig = {
    providers: [
        // ...
        provideHttpClient(),
        {
            provide: Configuration,
            useFactory: (authService: AuthService) => new Configuration({
                    basePath: 'http://localhost:9999',
                    withCredentials: true,
                    username: authService.getUsername(),
                    password: authService.getPassword(),
            }),
            deps: [AuthService],
            multi: false
        }
    ],
};
```

### Using multiple OpenAPI files / APIs

In order to use multiple APIs generated from different OpenAPI files,
you can create an alias name when importing the modules
in order to avoid naming conflicts:

```typescript
import { provideApi as provideUserApi } from 'my-user-api-path';
import { provideApi as provideAdminApi } from 'my-admin-api-path';
import { HttpClientModule } from '@angular/common/http';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
    providers: [
        // ...
        provideHttpClient(),
        provideUserApi(environment.basePath),
        provideAdminApi(environment.basePath),
    ],
};
```

### Customizing path parameter encoding

Without further customization, only [path-parameters][parameter-locations-url] of [style][style-values-url] 'simple'
and Dates for format 'date-time' are encoded correctly.

Other styles (e.g. "matrix") are not that easy to encode
and thus are best delegated to other libraries (e.g.: [@honoluluhenk/http-param-expander]).

To implement your own parameter encoding (or call another library),
pass an arrow-function or method-reference to the `encodeParam` property of the Configuration-object
(see [General Usage](#general-usage) above).

Example value for use in your Configuration-Provider:

```typescript
new Configuration({
    encodeParam: (param: Param) => myFancyParamEncoder(param),
})
```

[parameter-locations-url]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#parameter-locations
[style-values-url]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#style-values
[@honoluluhenk/http-param-expander]: https://www.npmjs.com/package/@honoluluhenk/http-param-expander
