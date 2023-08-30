import core from 'jscodeshift';
import {
  getJSXAttributes,
  getDefaultImportSpecifierName,
} from '@hypermod/utils';

export const renameRemoveButtonText = (j: core.JSCodeshift, source: any) => {
  const defaultSpecifier = getDefaultImportSpecifierName(
    j,
    source,
    '@atlaskit/tag',
  );

  if (!defaultSpecifier) return;

  source
    .findJSXElements(defaultSpecifier)
    .forEach((element: core.ASTPath<any>) => {
      getJSXAttributes(j, element, 'removeButtonText').forEach(attribute => {
        j(attribute).replaceWith(
          j.jsxAttribute(
            j.jsxIdentifier('removeButtonLabel'),
            attribute.node.value,
          ),
        );
      });
    });
};
