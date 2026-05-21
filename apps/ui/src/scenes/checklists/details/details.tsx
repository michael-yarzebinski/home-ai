import { useParams } from "react-router-dom";

export default function ChecklistDetails() {
  const { id } = useParams(); // This matches the ":id" in the router
  
  return <div>Viewing Checklist: {id}</div>;
}