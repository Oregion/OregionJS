/**
 * @module zepsh
 * Public API for the Zepsh framework.
 */
import { createElement, Fragment, Suspense, ErrorBoundary, memo, Profiler, StrictMode, ViewTransition } from "./src/element";
import { createContext } from "./src/context";
import { act } from "./src/testing";
import { useState, useEffect, useLayoutEffect, useInsertionEffect, useRef, useImperativeHandle, useMemo, useCallback, useReducer, useContext, useDeferredValue, useTransition, useActionState, useOptimistic, useSyncExternalStore, useId, useDebugValue, useErrorBoundary, useLocalStorage, useDebounce, useFetch, use, startTransition, cache } from "./src/hooks";
import { captureOwnerStack } from "./src/utils";
import { lazy } from "./src/lazy";

export const Hooks = {
  useState,
  useEffect,
  useLayoutEffect,
  useInsertionEffect,
  useRef,
  useImperativeHandle,
  useMemo,
  useCallback,
  useReducer,
  useContext,
  useDeferredValue,
  useTransition,
  useActionState,
  useOptimistic,
  useSyncExternalStore,
  useId,
  useDebugValue,
  useErrorBoundary,
  useLocalStorage,
  useDebounce,
  useFetch,
  use,
};

export const Components = {
  Fragment,
  Suspense,
  ErrorBoundary,
  Profiler,
  StrictMode,
  ViewTransition,
};

export const APIs = {
  createElement,
  createContext,
  memo,
  act,
  cache,
  captureOwnerStack,
  lazy,
  startTransition,
};

export default {
  ...Hooks,
  ...Components,
  ...APIs,
};
