import path from 'path';
import { createFilePath } from 'gatsby-source-filesystem';

interface Actions {
  createPage(page: any): void;
  createNodeField(nodeField: any): void;
}

type GraphQLResponse =
  | {
      errors: Error;
      data: undefined;
    }
  | {
      errors: undefined;
      data: any;
    };

type GraphQL = (query: string) => Promise<GraphQLResponse>;

interface CreatePages {
  graphql: GraphQL;
  actions: Actions;
}

interface OnCreateNode {
  node: any;
  actions: Actions;
  getNode: Function;
}

export function createPages({ graphql, actions }: CreatePages) {
  const { createPage } = actions;

  return new Promise((resolve, reject) => {
    const blogPost = path.resolve('./src/templates/blog-post.js');
    resolve(
      graphql(
        `
          {
            allMarkdownRemark(
              sort: { fields: [frontmatter___date], order: DESC }
              limit: 1000
            ) {
              edges {
                node {
                  fields {
                    slug
                  }
                  frontmatter {
                    title
                  }
                }
              }
            }
          }
        `,
      ).then(result => {
        if (result.errors) {
          console.log(result.errors);
          reject(result.errors);
        }

        // Create blog posts pages.
        const posts: any[] = result.data.allMarkdownRemark.edges;

        posts.forEach((post, index) => {
          const previous =
            index === posts.length - 1 ? null : posts[index + 1].node;
          const next = index === 0 ? null : posts[index - 1].node;

          createPage({
            path: post.node.fields.slug,
            component: blogPost,
            context: {
              slug: post.node.fields.slug,
              previous,
              next,
            },
          });
        });
      }),
    );
  });
}

export function onCreateNode({ node, actions, getNode }: OnCreateNode) {
  const { createNodeField } = actions;

  if (node.internal.type === `MarkdownRemark`) {
    const value = createFilePath({ node, getNode });
    createNodeField({
      name: `slug`,
      node,
      value,
    });
  }
}
