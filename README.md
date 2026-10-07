# Frontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.2.

## Development

The development environment is defined in `src/environments/environment.ts` and uses
`http://localhost:3000` for the local NestJS backend. Start that backend on port 3000,
then run:

```shell
npm start
```

Once the server is running, open `http://localhost:4200/`. The application automatically
reloads when source files change. If the local backend moves, update only `apiUrl` in the
development environment; repositories build their endpoint URLs from that value.

## Production API routing

Production replaces `src/environments/environment.ts` with
`src/environments/environment.production.ts` through Angular `fileReplacements`. Its `apiUrl`
is the same-origin path `/api`, so the production web server or ingress must proxy `/api/*` to
the NestJS backend and remove the `/api` prefix (for example, `/api/auth/profile` is forwarded
to `/auth/profile`). This avoids embedding a deployment-specific domain in the bundle.

If the frontend and backend are deployed on separate origins, replace the production `apiUrl`
with the real backend origin as part of the deployment configuration and configure backend CORS.
Do not use a placeholder domain. Validate the setup with:

```shell
npm run verify:environment
npx ng build --configuration production
```

## Backend contract smoke checklist

Run this checklist only against an isolated database whose name ends in `_test`; never use
production data or reset a development database. Start the NestJS backend on port 3000 with a
disposable administrator, then verify:

- `POST /auth/login` returns `access_token`, and that token can read `/auth/profile` with `ci`,
  `nombre`, `roleId`, `role`, and the seven camelCase permission flags.
- General user `PATCH` does not send `role_id`; role changes use the dedicated role endpoint.
- Item `POST` omits `stock`; item `PATCH` omits both `stock` and `codigo`.
- Inventory quantities accept integers in the supported range, and output `PATCH` sends only
  `observacion`.

The live smoke must be skipped when an isolated test database and disposable credentials are not
available; frontend mocks are not a substitute for this integration check.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```shell
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```shell
ng generate --help
```

## Building

To build the project run:

```shell
npm run build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```shell
npm test -- --watch=false --browsers=ChromeHeadless
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
