import "bulma/css/bulma.min.css";
import "./App.css";
import { UploadMap } from "./components/UploadMap";

const APP_NAME = "Hash Mapper";

function App() {
  return (
    <>
      <div className="App">
        <title>{APP_NAME}</title>
        <h1 className="title is-2">{APP_NAME}</h1>
        <UploadMap />
      </div>
    </>
  );
}

export default App;
