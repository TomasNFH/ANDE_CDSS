import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { RTLProvider } from "./contexts/RTLContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { SidebarProvider } from "./contexts/SidebarContext";
import HomePage from "./pages/HomePage";
import DataAcquisition from "./pages/DataAcquisition";
import EdaPage from "./pages/EdaPage";
import FullTable from "./pages/FullTable";
import AMLPage from "./pages/AutomlPage";
import AboutUs from "./pages/AboutUs";
import CDSSnep from "./pages/CDSSnep";
import CDSSonc from "./pages/CDSSoncology";
import PredictionsPage from "./pages/PredictionsPage";
// import ProfilePage from "./pages/ProfilePage";
// import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider
    client={queryClient}
    data-id="errvc3rcs"
    data-path="src/App.tsx"
  >
    <TooltipProvider data-id="vatxmr9en" data-path="src/App.tsx">
      <RTLProvider data-id="agz68ido5" data-path="src/App.tsx">
        <NotificationProvider data-id="rjve45o6m" data-path="src/App.tsx">
          <SidebarProvider>
            <Toaster data-id="sxumyftc5" data-path="src/App.tsx" />
            <Router
              data-id="7uy0flvgf"
              data-path="src/App.tsx"
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
            <Routes data-id="runrnwfjm" data-path="src/App.tsx">
              <Route
                path="/"
                element={
                  <HomePage data-id="9yzf6abeu" data-path="src/App.tsx" />
                }
                data-id="out6mcwww"
                data-path="src/App.tsx"
              />
              <Route
                path="/acquisition"
                element={
                  <DataAcquisition
                    data-id="wj8exhepp"
                    data-path="src/App.tsx"
                  />
                }
                data-id="52k7f39kw"
                data-path="src/App.tsx"
              />
              <Route
                path="/eda"
                element={
                  <EdaPage data-id="du43b0y8n" data-path="src/App.tsx" />
                }
                data-id="h5oru4vkq"
                data-path="src/App.tsx"
              />
              <Route path="/full-table" element={<FullTable />} />
              <Route
                path="/automl"
                element={
                  <AMLPage data-id="q7v7pd8zj" data-path="src/App.tsx" />
                }
                data-id="zb7uybxnj"
                data-path="src/App.tsx"
              />
              <Route
                path="/predictions"
                element={
                  <PredictionsPage data-id="q7v7pd8sa" data-path="src/App.tsx" />
                }
                data-id="zf7uybxnj"
                data-path="src/App.tsx"
              />
              {/* <Route path="/about" element={<AboutUs />} /> */}
              <Route path="/about" element={<AboutUs data-id="fbb6ea8d7" data-path="src/App.tsx" />} data-id="fzl9sn8wq" data-path="src/App.tsx" />
              <Route path="/cdssnep" element={<CDSSnep />} />
              <Route path="/cdssoncology" element={<CDSSonc />} />
              {/* <Route path="/profile" element={<ProfilePage data-id="7zgqa8nxb" data-path="src/App.tsx" />} data-id="5dm6nsds4" data-path="src/App.tsx" /> */}
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              {/* <Route path="*" element={<NotFound data-id="r0zaxma0a" data-path="src/App.tsx" />} data-id="gxxq8pxdm" data-path="src/App.tsx" /> */}
            </Routes>
          </Router>
            </SidebarProvider>
        </NotificationProvider>
      </RTLProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
