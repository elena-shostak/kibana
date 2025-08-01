/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ComponentType, ReactNode } from 'react';
import type { CommonProps } from '@elastic/eui';
import type { ParsedArgData, ParsedCommandInterface, PossibleArgDataTypes } from './service/types';
import type { CommandExecutionResultComponent } from './components/command_execution_result';
import type { CommandExecutionState, ArgSelectorState } from './components/console_state/types';
import type { Immutable, MaybeImmutable } from '../../../../common/endpoint/types';

/**
 * Definition interface for a Command argument
 */
export interface CommandArgDefinition {
  /**
   * If the argument is required to be entered by the user. NOTE that this will only validate that
   * the user has entered the argument name - it does not validate that the argument must have a
   * value. Arguments that have no value entered by the user have (by default) a value of
   * `true` boolean.
   */
  required: boolean;

  /** If argument can be used multiple times */
  allowMultiples: boolean;

  /**
   * Information about this argument. Value will be displayed in the help output when user enters the
   * command name with `--help`
   */
  about: ReactNode;

  /**
   * If argument (when used) should have a value defined by the user.
   * Default is `false` which mean that argument can be entered without any value - internally the
   * value for the argument will be a boolean `true`.
   * When set to `true` the argument is expected to have a value that is non-boolean
   * In addition, the following options can be used with this parameter to further validate the user's input:
   *
   * - `non-empty-string`: user's value must be a string whose length is greater than zero. Note that
   *   the value entered will first be `trim()`'d.
   * - `number`: user's value will be converted to a Number and ensured to be a `safe integer`
   * - `number-greater-than-zero`: user's value must be a number greater than zero
   * - `truthy`: The argument must have a value and the values must be "truthy" (evaluate to `Boolean` true)
   */
  mustHaveValue?: boolean | 'non-empty-string' | 'number' | 'number-greater-than-zero' | 'truthy';

  /**
   * Specifies that one or more arguments might be required, but only one of them can be used at a time.
   */
  exclusiveOr?: boolean;

  /**
   * Validate the individual values given to this argument.
   * Should return `true` if valid or a string with the error message
   */
  validate?: (argData: ParsedArgData) => true | string;

  /**
   * If defined, the provided Component will be rendered in place of this argument's value and
   * it will be up to the Selector to provide the desired interface to the user for selecting
   * the argument's value.
   */
  SelectorComponent?: CommandArgumentValueSelectorComponent;

  /**
   * If defined, the selector will use `true` as the default value which results in empty array as args value
   */
  selectorShowTextValue?: boolean;
}

/** List of arguments for a Command */
export interface CommandArgs {
  [longName: string]: CommandArgDefinition;
}

export interface CommandDefinition<TMeta = any> {
  /** Name of the command. This will be the value that the user will enter on the console to access this command */
  name: string;

  /** Some information about the command */
  about: ReactNode;

  /**
   * The Component that will be used to render the Command
   */
  RenderComponent: CommandExecutionComponent;

  /** Will be used to sort the commands when building the output for the `help` command */
  helpCommandPosition?: number;

  /** A grouping label for the command */
  helpGroupLabel?: string;

  /** Used only when command help "grouping" is detected. Used to sort the groups of commands */
  helpGroupPosition?: number;
  /**
   * If defined, this command's use of `--help` will be displayed using this component instead of
   * the console's built in output.
   */
  HelpComponent?: CommandExecutionComponent;

  /**
   * If defined, the button to add to the text bar will be disabled and the user will not be able to use this command if entered into the console.
   */
  helpDisabled?: boolean;

  /**
   * If defined, the command will be hidden from in the Help menu and help text. It will warn the user and not execute the command if manually typed in.
   */
  helpHidden?: boolean;

  /**
   * A store for any data needed when the command is executed.
   * The entire `CommandDefinition` is passed along to the component
   * that will handle it, so this data will be available there
   */
  meta?: TMeta;

  /** If all args are optional, but at least one must be defined, set to true */
  mustHaveArgs?: boolean;

  /**
   * Displayed in the input hint area when the user types the command. The Command usage will be
   * appended to this value
   */
  exampleInstruction?: string;

  /**
   * Displayed in the input hint area when the user types the command as well as in the output of
   * this command's `--help`. This value will override the command usage generated by the console
   * from the Command Definition. It's value displayed in `--help` would overriden by `helpUsage` if defined.
   */
  exampleUsage?: string;

  /**
   * Displayed in the output of this command's `--help`.
   * This value will override the command usage generated by the console
   * from the Command Definition.
   */
  helpUsage?: string;

  /**
   * Validate the command entered by the user. This is called only after the Console has ran
   * through all of its builtin validations (based on `CommandDefinition`).
   * Example: used it when there are multiple optional arguments but at least one of those
   * must be defined.
   */
  validate?: (command: Command) => true | string;

  /** The list of arguments supported by this command */
  args?: CommandArgs;
}

/**
 * The map of supported arguments by the command.
 * Used mainly with `CommandExecutionComponentProps`.
 */
export interface SupportedArguments {
  [argName: string]: PossibleArgDataTypes;
}

/**
 * A command to be executed (as entered by the user)
 */
export interface Command<
  TDefinition extends CommandDefinition = CommandDefinition,
  TArgs extends SupportedArguments = any
> {
  /** The raw input entered by the user */
  input: string;
  /**
   * The input value for display on the UI. This could differ from
   * `input` when Argument Value Selectors were used.
   */
  inputDisplay: string;
  /** An object with the arguments entered by the user and their value */
  args: ParsedCommandInterface<TArgs>;

  /** Object containing state for any argument that is using a Value Selector component */
  argState?: Record<string, ArgSelectorState[]>;

  /** The command definition associated with this user command */
  commandDefinition: TDefinition;
}

export interface CommandExecutionComponentProps<
  /** The arguments that could have been entered by the user */
  TArgs extends SupportedArguments = any,
  /** Internal store for the Command execution */
  TStore extends object = Record<string, unknown>,
  /** The metadata defined on the Command Definition */
  TMeta = any
> {
  command: Command<CommandDefinition<TMeta>, TArgs>;

  /**
   * A data store for the command execution to store data in, if needed.
   * Because the Console could be closed/opened several times, which will cause this component
   * to be `mounted`/`unmounted` several times, this data store will be beneficial for
   * persisting data (ex. API response with IDs) that the command can use to determine
   * if the command has already been executed or if it's a new instance.
   */
  store: Immutable<Partial<TStore>>;

  /**
   * Sets the `store` data above. Function will be called the latest (prevState) store data
   */
  setStore: (
    updateStoreFn: (prevState: Immutable<Partial<TStore>>) => MaybeImmutable<TStore>
  ) => void;

  /**
   * The status of the command execution.
   * Note that the console's UI will show the command as "busy" while the status here is
   * `pending`. Ensure that once the action processing completes, that this is set to
   * either `success` or `error`.
   */
  status: CommandExecutionState['status'];

  /** Set the status of the command execution  */
  setStatus: (status: CommandExecutionState['status']) => void;

  /**
   * A component that can be used to format the returned result from the command execution.
   */
  ResultComponent: CommandExecutionResultComponent;
}

/**
 * The component that will handle the Command execution and display the result.
 */
export type CommandExecutionComponent<
  /** The arguments that could have been entered by the user */
  TArgs extends SupportedArguments = any,
  /** Internal store for the Command execution */
  TStore extends object = any,
  /** The metadata defined on the Command Definition */
  TMeta = any
> = ComponentType<CommandExecutionComponentProps<TArgs, TStore, TMeta>>;

/**
 * The component props for an argument `SelectorComponent`
 */
export interface CommandArgumentValueSelectorProps<TSelection = any, TState = any> {
  /**
   * The current value that was selected. This will not be displayed in the UI, but will
   * be passed on to the command execution as part of the argument's value
   */
  value: TSelection | undefined;

  /**
   * A string value for display purposes only that describes the selected value. This
   * will be used when the command is entered and displayed in the console as well as in
   * the command input history popover
   */
  valueText: string;

  /**
   * The name of the Argument
   */
  argName: string;

  /**
   * The index (zero based) of the argument in the current command. This is a zero-based number indicating
   * which instance of the argument is being rendered.
   */
  argIndex: number;

  /**
   * A store for the Argument Selector. Should be used for any component state that needs to be
   * persisted across re-renders by the console.
   */
  store: TState;

  /**
   * callback for the Value Selector to call and provide the selection value.
   * This selection value will then be passed along with the argument to the command execution
   * component.
   * @param newData
   */
  onChange: (newData: ArgSelectorState<TState>) => void;

  /**
   * The full Command object containing command definition, input, and parsed arguments.
   * This provides context that selector components can use to access command metadata.
   */
  command: Command;

  /**
   * Callback to request focus back to the console input after selector operations.
   * Should be called when the selector component closes or completes its interaction.
   */
  requestFocus?: () => void;
}

/**
 * Component for rendering an argument's value selector
 */
export type CommandArgumentValueSelectorComponent =
  ComponentType<CommandArgumentValueSelectorProps>;

export interface ConsoleProps extends CommonProps {
  /**
   * The list of Commands that will be available in the console for the user to execute
   */
  commands: CommandDefinition[];

  /**
   * If defined, then the `help` builtin command will display this output instead of the default one
   * which is generated out of the Command list.
   */
  HelpComponent?: CommandExecutionComponent;

  /**
   * A component to be used in the Console's header title area (left side)
   */
  TitleComponent?: ComponentType;

  /** The string to display to the left of the input area */
  prompt?: string;

  /**
   * If defined, certain console data (ex. command input history) will be persisted to localstorage
   * using this prefix as part of the storage key. That data will then be retrieved and reused
   * across all console windows
   */
  storagePrefix?: string;

  /**
   * For internal use only!
   * Provided by the ConsoleManager to indicate that the console is being managed by it
   * @internal
   */
  managedKey?: symbol;
}
