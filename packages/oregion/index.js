/**
 * @module oregion
 * Public API for the Oregion framework.
 */
import { createElement, Fragment, Suspense, ErrorBoundary, memo } from "./src/element";
import { createContext } from "./src/context";
import { useState, useEffect, useLayoutEffect, useInsertionEffect, useRef, useImperativeHandle, useMemo, useCallback, useReducer, useContext, useDeferredValue, useTransition, useActionState, useOptimistic, useSyncExternalStore, useId, useDebugValue, useErrorBoundary, useLocalStorage, useDebounce, useFetch } from "./src/hooks";

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
};

export const Components = {
  Fragment,
  Suspense,
  ErrorBoundary,
};

export const APIs = {
  createElement,
  createContext,
  memo,
};

export default {
  ...Hooks,
  ...Components,
  ...APIs,
};
