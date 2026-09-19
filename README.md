# KTaNE Web Utils

## Available Scripts
In the project directory, you can run:

### `yarn start`
Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `yarn build`
Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

## Updating a Steam Workshop Collection from a Profile

This project can synchronize a Steam Workshop collection with a list of Steam Workshop item IDs.

### 1. Generate the Workshop item list

First, generate a list of Workshop item IDs from your KTaNE profile.

Open:

https://nicklatkovich.github.io/ktane-web-utils/profile-mod-collection

Upload your KTaNE profile to the website and generate the Workshop item list.

Save the generated file locally. This file will be used as the desired state of the Steam Workshop collection.

### 2. Run the synchronizer

The collection ID and input file are provided through environment variables.

```bash
COLLECTION_ID=123456 \
IDS_FILE=~/Downloads/profile-mods-list.txt \
yarn run-script ./scripts/update-workshop-collection.ts
```

The following environment variables are available:

| Variable           | Required | Default | Description                                   |
| ------------------ | -------- | ------- | --------------------------------------------- |
| `COLLECTION_ID`    | Yes      | —       | Steam Workshop collection ID to synchronize   |
| `IDS_FILE`         | Yes      | —       | Path to the file containing Workshop item IDs |
| `REQUEST_DELAY_MS` | No       | `700`   | Delay between Steam requests in milliseconds  |

For example, to use a 1-second delay:

```bash
COLLECTION_ID=123456 \
IDS_FILE=~/Downloads/profile-mods-list.txt \
REQUEST_DELAY_MS=1000 \
yarn run-script ./scripts/update-workshop-collection.ts
```

### 3. Steam login

The script opens the Steam Workshop collection management page in a browser.

It uses the existing Steam browser session. If Steam asks you to log in, complete the login manually in the browser.

After the collection page is ready, return to the terminal and **press Enter** to continue.

The script does not require your Steam password or cookies to be provided to it.

### 4. Synchronization

The script compares:

* items currently in the collection;
* items listed in `IDS_FILE`.

It calculates the required changes:

* **Add** — items present in the file but missing from the collection;
* **Remove** — items present in the collection but missing from the file;
* **Keep** — items already present in both.

Before making any changes, the script displays the synchronization plan and asks for confirmation.

The generated item list is treated as the desired state of the collection. Therefore, items currently in the collection but absent from the list will be removed.

### 5. Verification

After applying the changes, the script reloads the collection and verifies its contents against the requested list.

The final report shows:

* expected number of items;
* actual number of items;
* items that are still missing;
* items that are still present but were not requested.

A successful synchronization should look like:

```text
Verification:
  Expected: 138
  Actual:   138
  Missing:  0
  Extra:    0
```

The script then exits automatically.
