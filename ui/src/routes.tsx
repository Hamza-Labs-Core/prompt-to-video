import { createBrowserRouter } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import HomePage from "./pages/HomePage";
import ProjectPage from "./pages/ProjectPage";
import GeneratePage from "./pages/GeneratePage";
import SettingsPage from "./pages/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "project/:id",
        element: <ProjectPage />,
      },
      {
        path: "job/:jobId",
        element: <GeneratePage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
    ],
  },
]);
