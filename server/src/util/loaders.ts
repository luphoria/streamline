import { readdir, stat } from "node:fs/promises";
import { URL } from "node:url";
import {
	predicate as sourcePredicate,
	type Source,
} from "../structures/sources";
import type { PathLike } from "node:fs";

export type StructurePredicate<T> = (structure: Partial<T>) => boolean;

export async function loadStructures<T>(
	dir: PathLike,
	predicate: StructurePredicate<T>,
	recursive = true
): Promise<T[]> {
	const statDir = await stat(dir);
	if (!statDir.isDirectory()) {
		throw new Error(`The directory '${dir}' is not a directory.`);
	}
	const files = await readdir(dir);
	const structures: T[] = [];
	for (const file of files) {
		if (file === "index.ts" || !file.endsWith(".ts")) {
			continue;
		}

		const statFile = await stat(new URL(`${dir}${file}`));

		if (statFile.isDirectory() && recursive) {
			structures.push(
				...(await loadStructures(`${dir}${file}`, predicate, recursive))
			);
			continue;
		}
		const structure = await import(`${dir}${file}`);
		if (predicate(structure)) structures.push(structure);
	}

	return structures;
}

export async function loadSources(
	dir: PathLike,
	recursive: boolean = true
): Promise<Map<string, Source>> {
	const structures = await loadStructures<Source>(
		dir,
		sourcePredicate,
		recursive
	);

	return structures.reduce((acc, cur) => acc.set(cur.Name, cur), new Map());
}
