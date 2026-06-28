import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import EventsPage from "./pages/EventsPage";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<EventsPage />} />
                <Route path="/events" element={<EventsPage />} />
            </Routes>
        </BrowserRouter>
    );
}