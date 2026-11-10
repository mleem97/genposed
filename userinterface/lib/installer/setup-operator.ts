export interface OperatorBootstrapInput {
  name: string;
  email: string;
  password: string;
}

export interface OperatorBootstrapUser {
  id: string;
  role: string;
}

export interface OperatorBootstrapDependencies {
  operatorExists(): Promise<boolean>;
  createOperator(input: OperatorBootstrapInput): Promise<OperatorBootstrapUser>;
}

export function readOperatorBootstrapInput(environment: NodeJS.ProcessEnv): OperatorBootstrapInput {
  const name = environment.GENPOSED_OPERATOR_NAME?.trim();
  const email = environment.GENPOSED_OPERATOR_EMAIL?.trim();
  const password = environment.GENPOSED_OPERATOR_PASSWORD;
  if (!name || !email || !password) {
    throw new Error("GENPOSED_OPERATOR_NAME, GENPOSED_OPERATOR_EMAIL und GENPOSED_OPERATOR_PASSWORD müssen gesetzt sein.");
  }
  if (password.length < 12) throw new Error("Das Betreiberpasswort muss mindestens 12 Zeichen lang sein.");
  return { name, email, password };
}

export async function setupOperator(
  environment: NodeJS.ProcessEnv,
  dependencies: OperatorBootstrapDependencies,
): Promise<OperatorBootstrapUser> {
  const input = readOperatorBootstrapInput(environment);
  if (await dependencies.operatorExists()) {
    throw new Error("Ein Betreiberzugang existiert bereits; weitere Zugänge müssen durch einen angemeldeten Betreiber eingerichtet werden.");
  }
  const operator = await dependencies.createOperator(input);
  if (!operator.id || operator.role !== "operator") {
    throw new Error("Der Installationsschritt konnte den Betreiberzugang nicht sicher bestätigen.");
  }
  return operator;
}
