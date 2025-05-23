/**
 * @module oregion
 * Public API for the Oregion framework.
 */
import { createElement, Fragment, Suspense } from "./src/element";
import { createContext } from "./src/context";
import { useState, useEffect, useLayoutEffect, useInsertionEffect, useRef, useImperativeHandle, useMemo, useCallback, useReducer, useContext, useDeferredValue, useTransition, useActionState, useOptimistic, useSyncExternalStore, useId, useDebugValue, useLocalStorage, useDebounce, useFetch } from "./src/hooks";

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
  useLocalStorage,
  useDebounce,
  useFetch,
};

export const Components = {
  Fragment,
  Suspense,
};

export const APIs = {
  createElement,
  createContext,
};

export default {
  ...Hooks,
  ...Components,
  ...APIs,
};
