import { Editor } from "../Editor";

export default function NewDraft() {
  return (
    <>
      <h1 className="font-display text-3xl mb-8">New draft</h1>
      <Editor mode="create" />
    </>
  );
}
