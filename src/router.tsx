import { createBrowserRouter, Navigate } from "react-router-dom";

import { AuthLayout } from "./app/modules/_layouts/auth";
import { AppLayout } from "./app/modules/_layouts/app";
import { Error } from "@/error";
import LoginPage from "./app/modules/auth/pages/login";
import RegisterPage from "./app/modules/auth/pages/register";
import { Dashboard } from "./app/modules/admin/pages/dashboard";
import { RealEstateDashboard } from "./app/modules/real-estate/pages/dashboard";
import { NewApplicationPage } from "./app/modules/real-estate/pages/new-application";
import { ApplicationsPage } from "./app/modules/applications/pages/applications-page";
import { ApplicationDetailPage } from "./app/modules/applications/pages/application-detail";
import { ContractDataPage } from "./app/modules/applications/pages/contract-data";
import { ContestApplicationPage } from "./app/modules/applications/pages/contest-application";
import { RealEstatesPage } from "./app/modules/admin/pages/real-estates";
import ForgotPasswordPage from "./app/modules/auth/pages/forgot-password";
import ResetPasswordPage from "./app/modules/auth/pages/reset-password";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthLayout />,
    errorElement: <Error />,
    children: [
      {
        index: true,
        element: <LoginPage />,
      },
      {
        path: "sign-in",
        element: <LoginPage />,
      },
      {
        path: "sign-up",
        element: <RegisterPage />,
      },
      {
        path: "forgot-password",
        element: <ForgotPasswordPage />,
      },
      {
        path: "reset-password",
        element: <ResetPasswordPage />,
      },
    ],
  },
  {
    path: "/real_estate",
    element: <AppLayout expectedRole="REAL_ESTATE" />,
    errorElement: <Error />,
    children: [
      {
        index: true,
        element: <Navigate to="/real_estate/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <RealEstateDashboard />,
      },
      {
        path: "nova-consulta",
        element: <NewApplicationPage />,
      },
      {
        path: "consultas",
        element: <ApplicationsPage />,
      },
      {
        path: "consultas/:applicationId",
        element: <ApplicationDetailPage />,
      },
      {
        path: "consultas/:applicationId/contrato",
        element: <ContractDataPage />,
      },
      {
        path: "consultas/:applicationId/contestar",
        element: <ContestApplicationPage />,
      },
    ],
  },
  {
    path: "/admin",
    element: <AppLayout expectedRole="ADMIN" />,
    errorElement: <Error />,
    children: [
      {
        index: true,
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "consultas",
        element: <ApplicationsPage isAdmin />,
      },
      {
        path: "contestacoes",
        element: (
          <ApplicationsPage
            isAdmin
            forcedStatus="CONTESTED"
            eyebrow="Revisão manual"
            title="Consultas contestadas"
            description="Analise justificativas enviadas pelas imobiliárias e aprove ou reprove manualmente cada caso."
          />
        ),
      },
      {
        path: "contratos",
        element: (
          <ApplicationsPage
            isAdmin
            forcedStatuses={["WAITING_ADMIN_CONTRACT", "CONTRACT_GENERATED"]}
            tableMode="contracts"
            eyebrow="Contratos"
            title="Contratos"
            description="Acompanhe contratos prontos para geração, contratos gerados e contratos enviados para assinatura eletrônica."
          />
        ),
      },
      {
        path: "consultas/:applicationId",
        element: <ApplicationDetailPage isAdmin />,
      },
      {
        path: "imobiliarias",
        element: <RealEstatesPage />,
      },
    ],
  },
  {
    path: "/account-executive",
    element: <AppLayout expectedRole="ACCOUNT_EXECUTIVE" />,
    errorElement: <Error />,
    children: [
      {
        index: true,
        element: <Navigate to="/account-executive/consultas" replace />,
      },
      {
        path: "dashboard",
        element: <Navigate to="/account-executive/consultas" replace />,
      },
      {
        path: "consultas",
        element: (
          <ApplicationsPage
            isReadOnly
            eyebrow="Acompanhamento"
            title="Consultas"
            description="Visualize consultas, contratos e andamentos sem permissão para alterações."
          />
        ),
      },
      {
        path: "contratos",
        element: (
          <ApplicationsPage
            isReadOnly
            forcedStatuses={["WAITING_ADMIN_CONTRACT", "CONTRACT_GENERATED"]}
            tableMode="contracts"
            eyebrow="Contratos"
            title="Contratos"
            description="Acompanhe contratos gerados e processos de assinatura eletrônica."
          />
        ),
      },
      {
        path: "consultas/:applicationId",
        element: <ApplicationDetailPage isReadOnly />,
      },
    ],
  },
  {
    path: "/real-estate/*",
    element: <Navigate to="/real_estate/dashboard" replace />,
  },
  {
    path: "/account_executive/*",
    element: <Navigate to="/account-executive/consultas" replace />,
  },
  {
    path: "*",
    element: <Navigate to="/sign-in" replace />,
  },
]);
