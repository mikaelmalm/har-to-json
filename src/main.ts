import * as vscode from "vscode";
import * as fs from "fs";

export default function create() {
  var currentlyOpenTabfilePath =
    vscode.window.activeTextEditor?.document.uri.toString();

  if (
    !currentlyOpenTabfilePath ||
    currentlyOpenTabfilePath
      .toLocaleLowerCase()
      .substring(currentlyOpenTabfilePath.length - 4) !== ".har"
  ) {
    vscode.window.showInformationMessage("File is not a .har file");
    return;
  }

  // read and parse file content
  const jsonContent = vscode.window.activeTextEditor?.document.getText();
  const content = JSON.parse(jsonContent || "");

  const entries = content.log.entries;

  // path to current file
  const pathArr = currentlyOpenTabfilePath.split("/").slice(0, -1);
  const path = `${pathArr.join("/")}/code/harToJson`.replace("/Ubuntu/", "/");

  // clear result folder
  fs.rmSync(path, { recursive: true, force: true });

  entries.map((entry: Record<string, any>) => {
    if (!entry.response.content?.mimeType?.includes("application/json")) {
      return;
    }

    const fileurl = new URL(entry.request.url);
    const splitPath = fileurl.pathname.split("/").filter(Boolean);
    const name = splitPath.pop();
    const filePath = `${path}/${fileurl.hostname.replace(/\./g, "")}/${
      entry.request.method
    }/${splitPath.join("/")}`;
    const entryContent = entry.response.content.text;

    // create folders if it does not esist
    if (!fs.existsSync(`${path}/${fileurl.hostname}/${fileurl.pathname}`)) {
      console.log("create dir", filePath);
      fs.mkdirSync(filePath, { recursive: true });
    }

    // write content to file
    if (entryContent) {
      fs.writeFileSync(`${filePath}/${name}.json`, entryContent, "utf8");
    }
  });
}
