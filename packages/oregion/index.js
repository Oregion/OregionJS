/**
 * @module oregion
 * Public API for the Oregion framework.
 */
import { createElement, Fragment, Suspense } from "./src/element";
import { createContext } from "./src/context";
import { useState, useEffect, useLayoutEffect, useInsertionEffect, useRef, useImperativeHandle, useMemo, useCallback, useReducer, useContext, useDeferredValue, useTransition, useActionState, useOptimistic, useSyncExternalStore, useId, useDebugValue } from "./src/hooks";

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
