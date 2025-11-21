import "bulma/css/bulma.min.css";
import "./App.css";
import { UploadMap } from "./components/UploadMap";

function App() {
  return (
    <>
      <div className="App">
        <h1 className="title is-2">Hash Mapper</h1>
        <UploadMap />
      </div>
    </>
  );
}

export default App;
