/**
 * @module zepsh
 * Public API for the Zepsh framework.
 */
import { createElement, Fragment, Suspense, ErrorBoundary, memo, Profiler, StrictMode, ViewTransition, Activity, cloneElement, isValidElement, createRef } from "./src/element";
import { createContext } from "./src/context";
import { act } from "./src/testing";
import { useState, useEffect, useLayoutEffect, useInsertionEffect, useRef, useRefCleanup, useImperativeHandle, useMemo, useCallback, useReducer, useContext, useDeferredValue, useTransition, useActionState, useOptimistic, useSyncExternalStore, useId, useDebugValue, useErrorBoundary, useLocalStorage, useDebounce, useFetch, use, startTransition, cache, useFormStatus, useWindowSize, useInterval, useForm, useMediaQuery, useToggle, usePrevious, useLocale } from "./src/hooks";
import { captureOwnerStack, mergeRefs } from "./src/utils";
import { createFormScope } from "./src/form";
import { Children } from "./src/children";
import { lazy } from "./src/lazy";

export const Hooks = {
  useState,
  useEffect,
  useLayoutEffect,
  useInsertionEffect,
  useRef,
  useRefCleanup,
  useImperativeHandle,
  useMemo,
  useCallback,
  useReducer,
  useContext,
  useDeferredValue,
  useTransition,
  useActionState,
  useFormStatus,
  useOptimistic,
  useSyncExternalStore,
  useId,
  useDebugValue,
  useErrorBoundary,
  useLocalStorage,
  useDebounce,
  useFetch,
  useWindowSize,
  useInterval,
  useForm,
  useMediaQuery,
  useToggle,
  usePrevious,
  useLocale,
  use,
  startTransition,
};

export const Components = {
  Fragment,
  Suspense,
  ErrorBoundary,
  Profiler,
  StrictMode,
  ViewTransition,
  Activity,
};

export const APIs = {
  createElement,
  createContext,
  createFormScope,
  memo,
  act,
  cache,
  captureOwnerStack,
  mergeRefs,
  lazy,
  startTransition,
  cloneElement,
  isValidElement,
  createRef,
  Children,
};

export default {
  ...Hooks,
  ...Components,
  ...APIs,
};
