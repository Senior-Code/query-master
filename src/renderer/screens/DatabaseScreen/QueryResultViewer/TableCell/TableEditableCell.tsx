import {
  useMemo,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useRef,
} from 'react';
import styles from './styles.module.css';
import { QueryResultHeader } from 'types/SqlResult';
import { useEditableResult } from 'renderer/contexts/EditableQueryResultProvider';

export interface TableEditableCellHandler {
  discard: () => void;
  copy: () => void;
  paste: () => void;
  insert: (value: unknown) => void;
  setFocus: (focused: boolean) => void;
}

export interface TableEditableEditorProps {
  value: unknown;
  header: QueryResultHeader;
  readOnly?: boolean;
  onExit: (discard: boolean, value: unknown) => void;
}

export interface TableEditableContentProps {
  header: QueryResultHeader;
  value: unknown;
}

interface TableEditableCellProps {
  diff: (prev: unknown, current: unknown) => boolean;
  editor?: React.FC<TableEditableEditorProps>;
  detactEditor?: boolean;
  content: React.FC<TableEditableContentProps>;
  row: number;
  col: number;
  value: unknown;
  readOnly?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCopy?: (value: any) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPaste?: (value: string) => { accept: boolean; value: any };
  header: QueryResultHeader;
}

const TableEditableCell = forwardRef<
  TableEditableCellHandler,
  TableEditableCellProps
>(function TableEditableCell(
  {
    diff,
    detactEditor,
    editor: Editor,
    content: Content,
    col,
    row,
    value,
    readOnly,
    onCopy,
    onPaste,
    header,
  },
  ref
) {
  const { cellManager, setChange, removeChange, collector } =
    useEditableResult();
  const [afterValue, setAfterValue] = useState(
    collector.getChange(row, col, value)
  );
  const [onEditMode, setOnEditMode] = useState(false);
  const [onFocus, setFocus] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);

  const insertValueHandler = useCallback(
    (newValue: unknown) => {
      if (readOnly) return;

      setAfterValue(newValue);
      if (diff(value, newValue)) {
        setChange(row, col, newValue);
      } else {
        removeChange(row, col);
      }
    },
    [setAfterValue, setChange, diff, readOnly]
  );

  const copyHandler = useCallback(() => {
    if (onCopy) {
      window.navigator.clipboard.writeText(onCopy(afterValue));
    }
  }, [onCopy, afterValue]);

  const pasteHandler = useCallback(() => {
    if (onPaste) {
      window.navigator.clipboard.readText().then((pastedValue) => {
        const acceptPasteResult = onPaste(pastedValue);
        if (acceptPasteResult.accept) {
          const newValue = acceptPasteResult.value;
          insertValueHandler(newValue);
        }
      });
    }
  }, [onPaste, insertValueHandler]);

  useImperativeHandle(
    ref,
    () => {
      return {
        discard: () => {
          setAfterValue(value);
          removeChange(row, col);
        },
        insert: insertValueHandler,
        paste: pasteHandler,
        copy: copyHandler,
        setFocus,
      };
    },
    [setAfterValue, value, row, col, setFocus]
  );

  const hasChanged = useMemo(
    () => diff(afterValue, value),
    [afterValue, value, diff]
  );

  const onEnterEditMode = useCallback(() => {
    if (!onEditMode) {
      setOnEditMode(true);
    }
  }, [onEditMode, setOnEditMode]);

  const handleFocus = useCallback(() => {
    if (!onFocus) {
      cellManager.setFocus(row, col);
    }
  }, [setFocus, cellManager, onFocus, row, col]);

  const onExitEditMode = useCallback(
    (discard: boolean, newValue: unknown) => {
      setOnEditMode(false);
      if (!discard) {
        setAfterValue(newValue);

        if (diff(value, newValue)) {
          setChange(row, col, newValue);
        } else {
          removeChange(row, col);
        }
      }
    },
    [setOnEditMode, setAfterValue, diff, value]
  );

  useEffect(() => {
    if (onFocus && divRef.current) {
      const onKeyBinding = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
          copyHandler();
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
          pasteHandler();
        }
      };

      divRef.current.addEventListener('keydown', onKeyBinding);
      return () =>
        divRef?.current?.removeEventListener('keydown', onKeyBinding);
    }
  }, [divRef, onFocus, pasteHandler, copyHandler]);

  const className = [
    styles.container,
    hasChanged ? styles.changed : undefined,
    onFocus ? styles.focused : undefined,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      tabIndex={-1}
      ref={divRef}
      className={className}
      onClick={handleFocus}
      onContextMenu={handleFocus}
      onDoubleClick={onEnterEditMode}
    >
      {Editor && onEditMode ? (
        detactEditor ? (
          <>
            <Editor
              header={header}
              value={afterValue}
              onExit={onExitEditMode}
              readOnly={readOnly}
            />
            <Content value={afterValue} header={header} />
          </>
        ) : (
          <Editor
            header={header}
            value={afterValue}
            onExit={onExitEditMode}
            readOnly={readOnly}
          />
        )
      ) : (
        <Content value={afterValue} header={header} />
      )}
    </div>
  );
});

export default TableEditableCell;
