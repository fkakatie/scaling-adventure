# Edge Delivery Services in Adobe Experience Manager Sites as a Cloud Service with Document-Based Authoring Commerce Test!

## Prerequisites

- Github CLI https://cli.github.com/

## Environments
- Preview: [https://main--scaling-adventure--fkakatie.aem.page/](https://main--scaling-adventure--fkakatie.aem.page/)
- Live: [https://main--scaling-adventure--fkakatie.aem.live/](https://main--scaling-adventure--fkakatie.aem.live/)

## Local Setup

To set up the `scaling-adventure` project locally, follow these steps:

1. Clone the repository:

    ```bash copy
    gh repo clone fkakatie/scaling-adventure
    ```

1. Increase scope of Github CLI

    ```bash copy
    gh auth refresh --scopes read:packages
    ```

1. Install Dependencies:

    ```bash copy
    ./setup/install
    ```

## Local development

- Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`)

## Linting

```bash copy
npm run lint
```

## Run automation scripts on the local machine

1. Start AEM Proxy: `aem up`
1. Run automation command in another terminal: `npx cypress run --env tags=@all`