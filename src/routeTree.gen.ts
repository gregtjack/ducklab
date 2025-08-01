/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

import { Route as rootRouteImport } from './routes/__root'
import { Route as AboutRouteImport } from './routes/about'
import { Route as SettingsRouteRouteImport } from './routes/settings/route'
import { Route as IndexRouteImport } from './routes/index'
import { Route as SettingsIndexRouteImport } from './routes/settings/index'
import { Route as SettingsGeneralRouteImport } from './routes/settings/general'
import { Route as SettingsDuckdbRouteImport } from './routes/settings/duckdb'
import { Route as NotebookIdRouteImport } from './routes/notebook.$id'

const AboutRoute = AboutRouteImport.update({
  id: '/about',
  path: '/about',
  getParentRoute: () => rootRouteImport,
} as any)
const SettingsRouteRoute = SettingsRouteRouteImport.update({
  id: '/settings',
  path: '/settings',
  getParentRoute: () => rootRouteImport,
} as any)
const IndexRoute = IndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRouteImport,
} as any)
const SettingsIndexRoute = SettingsIndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => SettingsRouteRoute,
} as any)
const SettingsGeneralRoute = SettingsGeneralRouteImport.update({
  id: '/general',
  path: '/general',
  getParentRoute: () => SettingsRouteRoute,
} as any)
const SettingsDuckdbRoute = SettingsDuckdbRouteImport.update({
  id: '/duckdb',
  path: '/duckdb',
  getParentRoute: () => SettingsRouteRoute,
} as any)
const NotebookIdRoute = NotebookIdRouteImport.update({
  id: '/notebook/$id',
  path: '/notebook/$id',
  getParentRoute: () => rootRouteImport,
} as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/settings': typeof SettingsRouteRouteWithChildren
  '/about': typeof AboutRoute
  '/notebook/$id': typeof NotebookIdRoute
  '/settings/duckdb': typeof SettingsDuckdbRoute
  '/settings/general': typeof SettingsGeneralRoute
  '/settings/': typeof SettingsIndexRoute
}
export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/about': typeof AboutRoute
  '/notebook/$id': typeof NotebookIdRoute
  '/settings/duckdb': typeof SettingsDuckdbRoute
  '/settings/general': typeof SettingsGeneralRoute
  '/settings': typeof SettingsIndexRoute
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/settings': typeof SettingsRouteRouteWithChildren
  '/about': typeof AboutRoute
  '/notebook/$id': typeof NotebookIdRoute
  '/settings/duckdb': typeof SettingsDuckdbRoute
  '/settings/general': typeof SettingsGeneralRoute
  '/settings/': typeof SettingsIndexRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/'
    | '/settings'
    | '/about'
    | '/notebook/$id'
    | '/settings/duckdb'
    | '/settings/general'
    | '/settings/'
  fileRoutesByTo: FileRoutesByTo
  to:
    | '/'
    | '/about'
    | '/notebook/$id'
    | '/settings/duckdb'
    | '/settings/general'
    | '/settings'
  id:
    | '__root__'
    | '/'
    | '/settings'
    | '/about'
    | '/notebook/$id'
    | '/settings/duckdb'
    | '/settings/general'
    | '/settings/'
  fileRoutesById: FileRoutesById
}
export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  SettingsRouteRoute: typeof SettingsRouteRouteWithChildren
  AboutRoute: typeof AboutRoute
  NotebookIdRoute: typeof NotebookIdRoute
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/about': {
      id: '/about'
      path: '/about'
      fullPath: '/about'
      preLoaderRoute: typeof AboutRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/settings': {
      id: '/settings'
      path: '/settings'
      fullPath: '/settings'
      preLoaderRoute: typeof SettingsRouteRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/settings/': {
      id: '/settings/'
      path: '/'
      fullPath: '/settings/'
      preLoaderRoute: typeof SettingsIndexRouteImport
      parentRoute: typeof SettingsRouteRoute
    }
    '/settings/general': {
      id: '/settings/general'
      path: '/general'
      fullPath: '/settings/general'
      preLoaderRoute: typeof SettingsGeneralRouteImport
      parentRoute: typeof SettingsRouteRoute
    }
    '/settings/duckdb': {
      id: '/settings/duckdb'
      path: '/duckdb'
      fullPath: '/settings/duckdb'
      preLoaderRoute: typeof SettingsDuckdbRouteImport
      parentRoute: typeof SettingsRouteRoute
    }
    '/notebook/$id': {
      id: '/notebook/$id'
      path: '/notebook/$id'
      fullPath: '/notebook/$id'
      preLoaderRoute: typeof NotebookIdRouteImport
      parentRoute: typeof rootRouteImport
    }
  }
}

interface SettingsRouteRouteChildren {
  SettingsDuckdbRoute: typeof SettingsDuckdbRoute
  SettingsGeneralRoute: typeof SettingsGeneralRoute
  SettingsIndexRoute: typeof SettingsIndexRoute
}

const SettingsRouteRouteChildren: SettingsRouteRouteChildren = {
  SettingsDuckdbRoute: SettingsDuckdbRoute,
  SettingsGeneralRoute: SettingsGeneralRoute,
  SettingsIndexRoute: SettingsIndexRoute,
}

const SettingsRouteRouteWithChildren = SettingsRouteRoute._addFileChildren(
  SettingsRouteRouteChildren,
)

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  SettingsRouteRoute: SettingsRouteRouteWithChildren,
  AboutRoute: AboutRoute,
  NotebookIdRoute: NotebookIdRoute,
}
export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()
